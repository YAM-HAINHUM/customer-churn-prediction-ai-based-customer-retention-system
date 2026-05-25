"""
Machine Learning service: loads trained model artifacts and performs
churn predictions. Provides feature importance and confidence scoring.
"""
import os
import logging
import numpy as np
import pandas as pd
import joblib
from typing import Dict, Tuple, Optional

from ..config import settings

logger = logging.getLogger(__name__)

# ─── Singleton artifact holders ───────────────────────────────────────────────
_model = None
_scaler = None
_encoders: Optional[Dict] = None
_feature_names: Optional[list] = None
_artifacts_loaded = False

# Feature display name mapping for UI
FEATURE_DISPLAY_NAMES = {
    "tenure": "Tenure (months)",
    "monthly_charges": "Monthly Charges",
    "total_charges": "Total Charges",
    "contract_Month-to-month": "Month-to-Month Contract",
    "contract_One year": "One Year Contract",
    "contract_Two year": "Two Year Contract",
    "internet_service_Fiber optic": "Fiber Optic",
    "internet_service_DSL": "DSL",
    "internet_service_No": "No Internet",
    "payment_method_Electronic check": "Electronic Check",
    "payment_method_Mailed check": "Mailed Check",
    "payment_method_Bank transfer (automatic)": "Bank Transfer",
    "payment_method_Credit card (automatic)": "Credit Card",
    "tech_support_Yes": "Tech Support",
    "online_security_Yes": "Online Security",
    "online_backup_Yes": "Online Backup",
    "device_protection_Yes": "Device Protection",
    "streaming_tv_Yes": "Streaming TV",
    "streaming_movies_Yes": "Streaming Movies",
    "multiple_lines_Yes": "Multiple Lines",
    "gender_Male": "Male Gender",
    "senior_citizen": "Senior Citizen",
    "partner_Yes": "Has Partner",
    "dependents_Yes": "Has Dependents",
    "phone_service_Yes": "Phone Service",
    "paperless_billing_Yes": "Paperless Billing",
}


def load_artifacts() -> bool:
    """
    Load all ML artifacts from disk.
    Returns True if successful, False otherwise.
    """
    global _model, _scaler, _encoders, _feature_names, _artifacts_loaded

    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

        model_path = os.path.join(base_dir, settings.MODEL_PATH)
        scaler_path = os.path.join(base_dir, settings.SCALER_PATH)
        encoder_path = os.path.join(base_dir, settings.ENCODER_PATH)
        feature_path = os.path.join(base_dir, settings.FEATURE_NAMES_PATH)

        if not all(os.path.exists(p) for p in [model_path, scaler_path, encoder_path, feature_path]):
            logger.warning("[WARN] ML artifacts not found. Run ml/train.py first.")
            _artifacts_loaded = False
            return False

        _model = joblib.load(model_path)
        _scaler = joblib.load(scaler_path)
        _encoders = joblib.load(encoder_path)
        _feature_names = joblib.load(feature_path)

        _artifacts_loaded = True
        logger.info(f"[OK] ML artifacts loaded. Model: {type(_model).__name__}")
        return True

    except Exception as e:
        logger.error(f"[ERR] Failed to load ML artifacts: {e}")
        _artifacts_loaded = False
        return False


def is_ready() -> bool:
    """Check if the ML service has artifacts loaded."""
    return _artifacts_loaded


def _preprocess_input(customer_data: dict) -> np.ndarray:
    """
    Transform raw customer data dict into a feature vector
    matching the training data format.
    """
    df = pd.DataFrame([customer_data])

    # Rename to match training column names
    df = df.rename(columns={
        "gender": "gender",
        "senior_citizen": "SeniorCitizen",
        "partner": "Partner",
        "dependents": "Dependents",
        "tenure": "tenure",
        "phone_service": "PhoneService",
        "multiple_lines": "MultipleLines",
        "internet_service": "InternetService",
        "online_security": "OnlineSecurity",
        "online_backup": "OnlineBackup",
        "device_protection": "DeviceProtection",
        "tech_support": "TechSupport",
        "streaming_tv": "StreamingTV",
        "streaming_movies": "StreamingMovies",
        "contract": "Contract",
        "paperless_billing": "PaperlessBilling",
        "payment_method": "PaymentMethod",
        "monthly_charges": "MonthlyCharges",
        "total_charges": "TotalCharges",
    })

    # Apply saved label encoders for binary columns
    binary_cols = ["gender", "Partner", "Dependents", "PhoneService",
                   "PaperlessBilling"]
    for col in binary_cols:
        if col in _encoders and col in df.columns:
            df[col] = _encoders[col].transform(df[col].astype(str))

    # One-hot encode multi-category columns
    ohe_cols = ["MultipleLines", "InternetService", "OnlineSecurity",
                "OnlineBackup", "DeviceProtection", "TechSupport",
                "StreamingTV", "StreamingMovies", "Contract", "PaymentMethod"]
    df = pd.get_dummies(df, columns=ohe_cols)

    # Align with training feature set
    df = df.reindex(columns=_feature_names, fill_value=0)

    # Scale numeric features
    numeric_cols = ["tenure", "MonthlyCharges", "TotalCharges", "SeniorCitizen"]
    numeric_present = [c for c in numeric_cols if c in df.columns]
    df[numeric_present] = _scaler.transform(df[numeric_present])

    return df.values


def _get_confidence(probability: float) -> str:
    """Map churn probability to human-readable confidence level."""
    if probability >= 0.70 or probability <= 0.30:
        return "High"
    elif probability >= 0.55 or probability <= 0.45:
        return "Medium"
    else:
        return "Low"


def _get_feature_importance(n_top: int = 10) -> Dict[str, float]:
    """
    Extract top N feature importances from the model.
    Maps raw feature names to display-friendly names.
    """
    try:
        if hasattr(_model, "feature_importances_"):
            importances = _model.feature_importances_
        elif hasattr(_model, "coef_"):
            importances = np.abs(_model.coef_[0])
        else:
            return {}

        # Sort descending and take top N
        indices = np.argsort(importances)[::-1][:n_top]
        raw_features = [_feature_names[i] for i in indices]
        values = importances[indices]

        # Normalize to 0-100 scale
        if values.max() > 0:
            values = (values / values.max()) * 100

        result = {}
        for feat, val in zip(raw_features, values):
            display = FEATURE_DISPLAY_NAMES.get(feat, feat.replace("_", " ").title())
            result[display] = round(float(val), 2)

        return result

    except Exception as e:
        logger.error(f"Feature importance extraction failed: {e}")
        return {}


def predict(customer_data: dict) -> Tuple[str, float, str, Dict[str, float]]:
    """
    Run churn prediction on customer data.

    Returns:
        (prediction_label, probability, confidence, feature_importance)
    """
    if not _artifacts_loaded:
        raise RuntimeError("ML artifacts are not loaded. Run ml/train.py first.")

    features = _preprocess_input(customer_data)
    proba = _model.predict_proba(features)[0]  # [prob_not_churn, prob_churn]
    churn_prob = float(proba[1])

    prediction = "Churn" if churn_prob >= 0.5 else "Not Churn"
    confidence = _get_confidence(churn_prob)
    feature_importance = _get_feature_importance()

    return prediction, churn_prob, confidence, feature_importance
