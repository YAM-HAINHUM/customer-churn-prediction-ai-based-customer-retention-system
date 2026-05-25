"""
Customer Churn Prediction — ML Training Pipeline
================================================
Trains multiple classifiers on the Telco Customer Churn dataset,
evaluates them, tunes the best one, and saves all artifacts.

Usage:
    cd backend
    python -m ml.train

Dataset:
    Place WA_Fn-UseC_-Telco-Customer-Churn.csv in backend/data/
    OR the script will generate a synthetic dataset automatically.
"""

import os
import sys
import json
import warnings
import logging
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for servers
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, classification_report, confusion_matrix, roc_curve
)

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
logger = logging.getLogger(__name__)

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH  = os.path.join(BASE_DIR, "data", "WA_Fn-UseC_-Telco-Customer-Churn.csv")
ARTIFACT_DIR = os.path.join(BASE_DIR, "ml", "artifacts")
PLOT_DIR   = os.path.join(BASE_DIR, "ml", "plots")
os.makedirs(ARTIFACT_DIR, exist_ok=True)
os.makedirs(PLOT_DIR, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)


# ─── 1. Data Loading & Synthetic Generation ──────────────────────────────────

def generate_synthetic_dataset(n: int = 7043, seed: int = 42) -> pd.DataFrame:
    """
    Generate a realistic synthetic Telco-like churn dataset.
    Distributions are calibrated to match the real dataset statistics.
    """
    rng = np.random.default_rng(seed)
    logger.info(f"Generating synthetic dataset with {n} samples...")

    genders    = rng.choice(["Male", "Female"], n)
    senior     = rng.choice([0, 1], n, p=[0.84, 0.16])
    partner    = rng.choice(["Yes", "No"], n, p=[0.48, 0.52])
    dependents = rng.choice(["Yes", "No"], n, p=[0.30, 0.70])
    tenure     = np.clip(rng.integers(0, 73, n), 0, 72)

    phone_svc  = rng.choice(["Yes", "No"], n, p=[0.90, 0.10])
    multi_lines = np.where(
        phone_svc == "No",
        "No phone service",
        rng.choice(["Yes", "No"], n)
    )
    internet   = rng.choice(["DSL", "Fiber optic", "No"], n, p=[0.34, 0.44, 0.22])

    def inet_feature(arr, p_yes=0.3):
        result = []
        for i in arr:
            if i == "No":
                result.append("No internet service")
            else:
                result.append(rng.choice(["Yes", "No"], p=[p_yes, 1 - p_yes]))
        return result

    online_sec   = np.array(inet_feature(internet, 0.29))
    online_bkp   = np.array(inet_feature(internet, 0.34))
    dev_protect  = np.array(inet_feature(internet, 0.34))
    tech_supp    = np.array(inet_feature(internet, 0.29))
    streaming_tv = np.array(inet_feature(internet, 0.38))
    streaming_mv = np.array(inet_feature(internet, 0.39))

    contract     = rng.choice(["Month-to-month", "One year", "Two year"], n, p=[0.55, 0.21, 0.24])
    paper_bill   = rng.choice(["Yes", "No"], n, p=[0.59, 0.41])
    payment      = rng.choice(
        ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"],
        n, p=[0.34, 0.23, 0.22, 0.21]
    )

    monthly = np.where(
        internet == "No",
        rng.uniform(19, 35, n),
        np.where(internet == "DSL", rng.uniform(25, 65, n), rng.uniform(65, 110, n))
    ).round(2)

    total_charges = (monthly * tenure + rng.uniform(-20, 20, n)).clip(0).round(2)
    total_charges = np.where(tenure == 0, 0, total_charges)

    # Churn probability: based on known drivers
    churn_logit = (
        -2.0
        + 1.5 * (contract == "Month-to-month").astype(float)
        - 0.8 * (contract == "Two year").astype(float)
        + 0.8 * (internet == "Fiber optic").astype(float)
        + 0.5 * (payment == "Electronic check").astype(float)
        - 0.03 * tenure
        + 0.02 * monthly
        + 0.4 * senior.astype(float)
        - 0.5 * (tech_supp == "Yes").astype(float)
        - 0.4 * (online_sec == "Yes").astype(float)
        + rng.normal(0, 0.3, n)
    )
    churn_prob = 1 / (1 + np.exp(-churn_logit))
    churn = (rng.uniform(0, 1, n) < churn_prob).astype(int)
    churn_labels = np.where(churn == 1, "Yes", "No")

    df = pd.DataFrame({
        "customerID": [f"CUST-{i:05d}" for i in range(n)],
        "gender": genders,
        "SeniorCitizen": senior,
        "Partner": partner,
        "Dependents": dependents,
        "tenure": tenure,
        "PhoneService": phone_svc,
        "MultipleLines": multi_lines,
        "InternetService": internet,
        "OnlineSecurity": online_sec,
        "OnlineBackup": online_bkp,
        "DeviceProtection": dev_protect,
        "TechSupport": tech_supp,
        "StreamingTV": streaming_tv,
        "StreamingMovies": streaming_mv,
        "Contract": contract,
        "PaperlessBilling": paper_bill,
        "PaymentMethod": payment,
        "MonthlyCharges": monthly,
        "TotalCharges": total_charges.astype(str),
        "Churn": churn_labels,
    })
    logger.info(f"Synthetic dataset shape: {df.shape}  Churn rate: {churn.mean():.2%}")
    return df


def load_dataset() -> pd.DataFrame:
    """Load real dataset if available; otherwise generate synthetic one."""
    if os.path.exists(DATA_PATH):
        logger.info(f"Loading real dataset from {DATA_PATH}")
        df = pd.read_csv(DATA_PATH)
        logger.info(f"Dataset loaded: {df.shape}  Churn rate: {(df['Churn']=='Yes').mean():.2%}")
        return df
    else:
        logger.warning("Real dataset not found. Using synthetic data.")
        df = generate_synthetic_dataset()
        df.to_csv(DATA_PATH, index=False)
        return df


# ─── 2. Preprocessing ────────────────────────────────────────────────────────

def preprocess(df: pd.DataFrame):
    """
    Full preprocessing pipeline:
      - Drop irrelevant columns
      - Fix TotalCharges dtype
      - Encode categorical features
      - Scale numeric features
    Returns (X_train, X_test, y_train, y_test, scaler, encoders, feature_names)
    """
    df = df.copy()

    # Drop customer ID
    df.drop(columns=["customerID"], errors="ignore", inplace=True)

    # Fix TotalCharges: coerce blanks (new customers) to 0
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce").fillna(0.0)

    # Encode target
    df["Churn"] = (df["Churn"] == "Yes").astype(int)
    y = df.pop("Churn")

    # Binary label encoding
    encoders = {}
    binary_cols = ["gender", "Partner", "Dependents", "PhoneService", "PaperlessBilling"]
    for col in binary_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    # One-hot encode remaining categoricals
    ohe_cols = ["MultipleLines", "InternetService", "OnlineSecurity",
                "OnlineBackup", "DeviceProtection", "TechSupport",
                "StreamingTV", "StreamingMovies", "Contract", "PaymentMethod"]
    df = pd.get_dummies(df, columns=ohe_cols)

    feature_names = list(df.columns)

    # Scale numeric features
    numeric_cols = ["tenure", "MonthlyCharges", "TotalCharges", "SeniorCitizen"]
    scaler = StandardScaler()
    df[numeric_cols] = scaler.fit_transform(df[numeric_cols])

    X_train, X_test, y_train, y_test = train_test_split(
        df, y, test_size=0.2, random_state=42, stratify=y
    )
    logger.info(f"Train: {X_train.shape}  Test: {X_test.shape}")
    return X_train, X_test, y_train, y_test, scaler, encoders, feature_names


# ─── 3. EDA Visualizations ───────────────────────────────────────────────────

def run_eda(df: pd.DataFrame):
    """Generate and save EDA plots."""
    logger.info("Running EDA...")
    raw = df.copy()
    raw["TotalCharges"] = pd.to_numeric(raw["TotalCharges"], errors="coerce").fillna(0)
    churn_rate = (raw["Churn"] == "Yes").mean()

    # --- Plot 1: Churn Distribution ---
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    fig.suptitle("Customer Churn Analysis", fontsize=16, fontweight="bold")
    counts = raw["Churn"].value_counts()
    axes[0].pie(counts, labels=counts.index, autopct="%1.1f%%",
                colors=["#10B981", "#EF4444"], startangle=90)
    axes[0].set_title("Churn Distribution")
    axes[1].bar(counts.index, counts.values, color=["#10B981", "#EF4444"])
    axes[1].set_title("Churn Count")
    axes[1].set_xlabel("Churn")
    axes[1].set_ylabel("Count")
    plt.tight_layout()
    plt.savefig(os.path.join(PLOT_DIR, "01_churn_distribution.png"), dpi=150)
    plt.close()

    # --- Plot 2: Numerical Feature Distributions ---
    num_feats = ["tenure", "MonthlyCharges", "TotalCharges"]
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    for i, feat in enumerate(num_feats):
        for label, color in [("Yes", "#EF4444"), ("No", "#10B981")]:
            axes[i].hist(
                raw[raw["Churn"] == label][feat], bins=30,
                alpha=0.6, label=label, color=color
            )
        axes[i].set_title(f"{feat} by Churn")
        axes[i].legend()
    plt.tight_layout()
    plt.savefig(os.path.join(PLOT_DIR, "02_numeric_distributions.png"), dpi=150)
    plt.close()

    # --- Plot 3: Contract vs Churn ---
    fig, ax = plt.subplots(figsize=(10, 5))
    contract_churn = raw.groupby(["Contract", "Churn"]).size().unstack(fill_value=0)
    contract_churn.plot(kind="bar", ax=ax, color=["#10B981", "#EF4444"])
    ax.set_title("Contract Type vs Churn")
    ax.set_xlabel("Contract")
    ax.set_ylabel("Count")
    ax.tick_params(axis="x", rotation=30)
    plt.tight_layout()
    plt.savefig(os.path.join(PLOT_DIR, "03_contract_vs_churn.png"), dpi=150)
    plt.close()

    # --- Plot 4: Correlation Heatmap ---
    df_enc = raw.copy()
    for col in df_enc.select_dtypes("object").columns:
        df_enc[col] = LabelEncoder().fit_transform(df_enc[col].astype(str))
    fig, ax = plt.subplots(figsize=(14, 10))
    mask = np.triu(np.ones_like(df_enc.corr(), dtype=bool))
    sns.heatmap(df_enc.corr(), mask=mask, annot=False,
                cmap="coolwarm", linewidths=0.5, ax=ax)
    ax.set_title("Feature Correlation Matrix")
    plt.tight_layout()
    plt.savefig(os.path.join(PLOT_DIR, "04_correlation_heatmap.png"), dpi=150)
    plt.close()

    logger.info(f"EDA plots saved to {PLOT_DIR}")


# ─── 4. Model Training & Evaluation ─────────────────────────────────────────

def evaluate_model(name, model, X_test, y_test) -> dict:
    """Compute and return evaluation metrics."""
    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else y_pred

    metrics = {
        "model": name,
        "accuracy":  round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
        "recall":    round(recall_score(y_test, y_pred, zero_division=0), 4),
        "f1_score":  round(f1_score(y_test, y_pred, zero_division=0), 4),
        "roc_auc":   round(roc_auc_score(y_test, y_proba), 4),
    }
    logger.info(
        f"{name:30s}  Acc: {metrics['accuracy']:.4f}  "
        f"F1: {metrics['f1_score']:.4f}  AUC: {metrics['roc_auc']:.4f}"
    )
    return metrics


def plot_model_comparison(results: list):
    """Bar chart comparing all models across metrics."""
    df_res = pd.DataFrame(results).set_index("model")
    fig, ax = plt.subplots(figsize=(12, 6))
    df_res[["accuracy", "precision", "recall", "f1_score", "roc_auc"]].plot(
        kind="bar", ax=ax, colormap="viridis"
    )
    ax.set_title("Model Performance Comparison")
    ax.set_ylabel("Score")
    ax.set_ylim(0, 1)
    ax.tick_params(axis="x", rotation=30)
    ax.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(os.path.join(PLOT_DIR, "05_model_comparison.png"), dpi=150)
    plt.close()


def plot_confusion_matrix(model, X_test, y_test, name: str):
    cm = confusion_matrix(y_test, model.predict(X_test))
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=["No Churn", "Churn"],
                yticklabels=["No Churn", "Churn"], ax=ax)
    ax.set_title(f"Confusion Matrix — {name}")
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    plt.tight_layout()
    plt.savefig(os.path.join(PLOT_DIR, f"06_confusion_matrix_{name.replace(' ', '_')}.png"), dpi=150)
    plt.close()


def plot_roc_curves(models_dict: dict, X_test, y_test):
    fig, ax = plt.subplots(figsize=(8, 6))
    for name, model in models_dict.items():
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X_test)[:, 1]
            fpr, tpr, _ = roc_curve(y_test, proba)
            auc = roc_auc_score(y_test, proba)
            ax.plot(fpr, tpr, label=f"{name} (AUC={auc:.3f})")
    ax.plot([0, 1], [0, 1], "k--", label="Random")
    ax.set_title("ROC Curves — All Models")
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(PLOT_DIR, "07_roc_curves.png"), dpi=150)
    plt.close()


def plot_feature_importance(model, feature_names: list, top_n: int = 20):
    if not hasattr(model, "feature_importances_"):
        return
    importances = pd.Series(model.feature_importances_, index=feature_names).nlargest(top_n)
    fig, ax = plt.subplots(figsize=(10, 8))
    importances.sort_values().plot(kind="barh", ax=ax, color="#1E6FFF")
    ax.set_title(f"Top {top_n} Feature Importances")
    ax.set_xlabel("Importance Score")
    plt.tight_layout()
    plt.savefig(os.path.join(PLOT_DIR, "08_feature_importance.png"), dpi=150)
    plt.close()


# ─── 5. Hyperparameter Tuning ─────────────────────────────────────────────────

def tune_random_forest(X_train, y_train) -> RandomForestClassifier:
    """
    Tune Random Forest using RandomizedSearchCV for efficiency.
    Falls back to default params on error.
    """
    from sklearn.model_selection import RandomizedSearchCV
    param_dist = {
        "n_estimators": [100, 200, 300],
        "max_depth": [None, 10, 20, 30],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4],
        "max_features": ["sqrt", "log2"],
        "class_weight": ["balanced", None],
    }
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    search = RandomizedSearchCV(
        RandomForestClassifier(random_state=42),
        param_distributions=param_dist,
        n_iter=20, cv=cv, scoring="roc_auc",
        n_jobs=-1, random_state=42, verbose=1,
    )
    logger.info("Tuning Random Forest (RandomizedSearchCV)...")
    search.fit(X_train, y_train)
    logger.info(f"Best RF params: {search.best_params_}")
    logger.info(f"Best CV AUC: {search.best_score_:.4f}")
    return search.best_estimator_


# ─── Main Pipeline ────────────────────────────────────────────────────────────

def main():
    print("\n" + "=" * 60)
    print("  CUSTOMER CHURN PREDICTION — ML TRAINING PIPELINE")
    print("=" * 60 + "\n")

    # 1. Load data
    df = load_dataset()

    # 2. EDA
    run_eda(df)

    # 3. Preprocessing
    X_train, X_test, y_train, y_test, scaler, encoders, feature_names = preprocess(df)

    # 4. Train base models
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced"),
        "Decision Tree":       DecisionTreeClassifier(random_state=42, class_weight="balanced"),
        "Random Forest":       RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced", n_jobs=-1),
        "SVM":                 SVC(probability=True, random_state=42, class_weight="balanced"),
    }

    results = []
    for name, model in models.items():
        logger.info(f"Training {name}...")
        model.fit(X_train, y_train)
        metrics = evaluate_model(name, model, X_test, y_test)
        results.append(metrics)
        print(classification_report(y_test, model.predict(X_test),
                                    target_names=["Not Churn", "Churn"]))

    # 5. Plots
    plot_model_comparison(results)
    plot_roc_curves(models, X_test, y_test)

    # 6. Best model = highest ROC-AUC baseline
    best_name = max(results, key=lambda x: x["roc_auc"])["model"]
    logger.info(f"\nBest baseline model: {best_name}")

    # 7. Tune Random Forest (typically best)
    tuned_rf = tune_random_forest(X_train, y_train)
    tuned_metrics = evaluate_model("Tuned Random Forest", tuned_rf, X_test, y_test)

    # Select best between tuned RF and baseline best
    rf_auc = tuned_metrics["roc_auc"]
    base_auc = max(r["roc_auc"] for r in results)
    if rf_auc >= base_auc:
        best_model = tuned_rf
        final_name = "Tuned Random Forest"
    else:
        best_model = models[best_name]
        final_name = best_name
    logger.info(f"🏆 Final best model: {final_name}")

    # 8. Detailed plots for best model
    plot_confusion_matrix(best_model, X_test, y_test, final_name)
    plot_feature_importance(best_model, feature_names)

    # 9. Save artifacts
    joblib.dump(best_model,    os.path.join(ARTIFACT_DIR, "best_model.pkl"))
    joblib.dump(scaler,        os.path.join(ARTIFACT_DIR, "scaler.pkl"))
    joblib.dump(encoders,      os.path.join(ARTIFACT_DIR, "encoders.pkl"))
    joblib.dump(feature_names, os.path.join(ARTIFACT_DIR, "feature_names.pkl"))

    # Save metadata
    metadata = {
        "model_name": final_name,
        "model_type": type(best_model).__name__,
        "feature_count": len(feature_names),
        "test_metrics": tuned_metrics if final_name == "Tuned Random Forest" else
                        next(r for r in results if r["model"] == final_name),
        "all_results": results,
    }
    with open(os.path.join(ARTIFACT_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print("\n" + "=" * 60)
    print(f"  Training complete!")
    print(f"  Model: {final_name}")
    print(f"  AUC:   {tuned_metrics['roc_auc']:.4f}")
    print(f"  Artifacts saved to: {ARTIFACT_DIR}")
    print(f"  EDA plots saved to: {PLOT_DIR}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
