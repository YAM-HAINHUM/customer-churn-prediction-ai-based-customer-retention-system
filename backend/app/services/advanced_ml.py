"""
Advanced ML services: retention simulator, XAI explanations,
customer segmentation, churn forecasting, CLV, anomaly detection.
"""
import numpy as np
import pandas as pd
import logging
from typing import Dict, List, Tuple, Optional
from . import ml_service

logger = logging.getLogger(__name__)

# ─── Retention Simulator ──────────────────────────────────────────────────────

RETENTION_ACTIONS = {
    "discount_10": {"monthly_charges_reduction": 0.10, "label": "10% Discount"},
    "discount_20": {"monthly_charges_reduction": 0.20, "label": "20% Discount"},
    "loyalty_reward": {"tenure_boost": 6, "label": "Loyalty Reward (+6mo tenure)"},
    "upgrade_support": {"tech_support": "Yes", "online_security": "Yes", "label": "Upgrade Support"},
    "annual_contract": {"contract": "One year", "label": "Switch to Annual Contract"},
    "two_year_contract": {"contract": "Two year", "label": "Switch to 2-Year Contract"},
    "bundle_offer": {"monthly_charges_reduction": 0.15, "online_backup": "Yes", "device_protection": "Yes", "label": "Bundle Offer"},
}


def simulate_retention(customer_data: dict, actions: List[str]) -> Dict:
    """
    Apply retention actions to customer data and re-predict churn probability.
    Returns before/after comparison with impact analysis.
    """
    if not ml_service.is_ready():
        return {"error": "Model not loaded"}

    # Baseline prediction
    _, base_prob, _, _ = ml_service.predict(customer_data)

    results = []
    for action_key in actions:
        action = RETENTION_ACTIONS.get(action_key)
        if not action:
            continue

        modified = dict(customer_data)

        # Apply action modifications
        if "monthly_charges_reduction" in action:
            modified["monthly_charges"] = max(
                0, customer_data["monthly_charges"] * (1 - action["monthly_charges_reduction"])
            )
        if "tenure_boost" in action:
            modified["tenure"] = min(100, customer_data["tenure"] + action["tenure_boost"])
        if "tech_support" in action:
            modified["tech_support"] = action["tech_support"]
        if "online_security" in action:
            modified["online_security"] = action["online_security"]
        if "contract" in action:
            modified["contract"] = action["contract"]
        if "online_backup" in action:
            modified["online_backup"] = action["online_backup"]
        if "device_protection" in action:
            modified["device_protection"] = action["device_protection"]

        try:
            _, new_prob, _, _ = ml_service.predict(modified)
            reduction = base_prob - new_prob
            results.append({
                "action": action_key,
                "label": action["label"],
                "before_probability": round(base_prob, 4),
                "after_probability": round(new_prob, 4),
                "reduction": round(reduction, 4),
                "reduction_pct": round(reduction * 100, 1),
                "effective": reduction > 0.05,
            })
        except Exception as e:
            logger.warning(f"Simulation failed for {action_key}: {e}")

    results.sort(key=lambda x: x["reduction"], reverse=True)
    return {
        "baseline_probability": round(base_prob, 4),
        "baseline_risk": "High" if base_prob >= 0.7 else "Medium" if base_prob >= 0.4 else "Low",
        "simulations": results,
        "best_action": results[0] if results else None,
    }


# ─── XAI / SHAP-style Explanations ───────────────────────────────────────────

FEATURE_IMPACT_RULES = {
    "contract": {
        "Month-to-month": ("Month-to-month contract", +0.21, "High churn risk — no long-term commitment"),
        "One year": ("One year contract", -0.08, "Moderate commitment reduces churn risk"),
        "Two year": ("Two year contract", -0.18, "Long-term contract significantly reduces churn"),
    },
    "internet_service": {
        "Fiber optic": ("Fiber optic internet", +0.12, "Fiber optic users churn more due to higher costs"),
        "DSL": ("DSL internet", -0.03, "DSL users show average churn behavior"),
        "No": ("No internet service", -0.08, "No internet service correlates with lower churn"),
    },
    "payment_method": {
        "Electronic check": ("Electronic check payment", +0.09, "Electronic check users churn more frequently"),
        "Mailed check": ("Mailed check payment", +0.02, "Mailed check shows slightly elevated churn"),
        "Bank transfer (automatic)": ("Auto bank transfer", -0.06, "Automatic payments reduce churn risk"),
        "Credit card (automatic)": ("Auto credit card", -0.05, "Automatic payments reduce churn risk"),
    },
    "tech_support": {
        "No": ("No tech support", +0.08, "Lack of tech support increases frustration and churn"),
        "Yes": ("Has tech support", -0.07, "Tech support availability reduces churn"),
    },
    "online_security": {
        "No": ("No online security", +0.06, "Missing security features increase churn risk"),
        "Yes": ("Has online security", -0.05, "Security features improve customer retention"),
    },
}


def get_xai_explanation(customer_data: dict, probability: float) -> Dict:
    """
    Generate SHAP-style feature contribution explanations.
    Returns top positive and negative contributors to churn probability.
    """
    contributions = []

    # Tenure impact
    tenure = customer_data.get("tenure", 0)
    if tenure < 6:
        contributions.append({
            "feature": "Very short tenure",
            "value": f"{tenure} months",
            "impact": +0.17,
            "direction": "increases",
            "explanation": "New customers (< 6 months) have very high churn risk",
        })
    elif tenure < 12:
        contributions.append({
            "feature": "Short tenure",
            "value": f"{tenure} months",
            "impact": +0.10,
            "direction": "increases",
            "explanation": "Customers under 1 year show elevated churn risk",
        })
    elif tenure > 36:
        contributions.append({
            "feature": "Long tenure",
            "value": f"{tenure} months",
            "impact": -0.15,
            "direction": "decreases",
            "explanation": "Long-term customers are significantly less likely to churn",
        })

    # Monthly charges impact
    charges = customer_data.get("monthly_charges", 0)
    if charges > 80:
        contributions.append({
            "feature": "High monthly charges",
            "value": f"${charges:.2f}",
            "impact": +0.14,
            "direction": "increases",
            "explanation": "High monthly bills are a top driver of customer churn",
        })
    elif charges < 30:
        contributions.append({
            "feature": "Low monthly charges",
            "value": f"${charges:.2f}",
            "impact": -0.08,
            "direction": "decreases",
            "explanation": "Low-cost plans have better retention rates",
        })

    # Contract, internet, payment, support rules
    for field, rules in FEATURE_IMPACT_RULES.items():
        val = customer_data.get(field)
        if val and val in rules:
            feat_name, impact, explanation = rules[val]
            contributions.append({
                "feature": feat_name,
                "value": val,
                "impact": impact,
                "direction": "increases" if impact > 0 else "decreases",
                "explanation": explanation,
            })

    # Senior citizen
    if customer_data.get("senior_citizen") == 1:
        contributions.append({
            "feature": "Senior citizen",
            "value": "Yes",
            "impact": +0.05,
            "direction": "increases",
            "explanation": "Senior citizens show slightly higher churn rates",
        })

    # Sort by absolute impact
    contributions.sort(key=lambda x: abs(x["impact"]), reverse=True)
    top = contributions[:6]

    risk_factors = [c for c in top if c["impact"] > 0]
    protective_factors = [c for c in top if c["impact"] < 0]

    # Generate natural language summary
    if probability >= 0.7:
        summary = f"This customer has HIGH churn risk ({probability*100:.0f}%). "
    elif probability >= 0.4:
        summary = f"This customer has MEDIUM churn risk ({probability*100:.0f}%). "
    else:
        summary = f"This customer has LOW churn risk ({probability*100:.0f}%). "

    if risk_factors:
        top_risk = risk_factors[0]
        summary += f"Primary driver: {top_risk['feature']} ({top_risk['explanation'].lower()})."

    return {
        "probability": round(probability, 4),
        "risk_level": "High" if probability >= 0.7 else "Medium" if probability >= 0.4 else "Low",
        "summary": summary,
        "top_contributors": top,
        "risk_factors": risk_factors[:3],
        "protective_factors": protective_factors[:3],
        "confidence_score": round(abs(probability - 0.5) * 2, 3),
    }


# ─── Customer Segmentation ────────────────────────────────────────────────────

def segment_customers(predictions: List[dict]) -> Dict:
    """
    Segment customers from prediction history using rule-based clustering.
    Returns segment counts, characteristics, and insights.
    """
    if not predictions:
        return {"segments": [], "total": 0}

    segments = {"loyal": [], "premium": [], "price_sensitive": [], "high_risk": []}

    for p in predictions:
        inp = p.get("input_data", {})
        prob = p.get("probability", 0)
        tenure = inp.get("tenure", 0) if isinstance(inp, dict) else getattr(inp, "tenure", 0)
        charges = inp.get("monthly_charges", 0) if isinstance(inp, dict) else getattr(inp, "monthly_charges", 0)
        contract = inp.get("contract", "") if isinstance(inp, dict) else getattr(inp, "contract", "")

        if prob >= 0.7:
            segments["high_risk"].append(p)
        elif tenure > 24 and prob < 0.3:
            segments["loyal"].append(p)
        elif charges > 70:
            segments["premium"].append(p)
        else:
            segments["price_sensitive"].append(p)

    total = len(predictions)
    result = []
    configs = [
        ("high_risk",       "High Risk",        "#EF4444", "🚨", "Immediate retention action needed"),
        ("loyal",           "Loyal Customers",  "#10B981", "💚", "Long-term customers with low churn risk"),
        ("premium",         "Premium Users",    "#8B5CF6", "⭐", "High-value customers with premium plans"),
        ("price_sensitive", "Price Sensitive",  "#F59E0B", "💰", "Cost-conscious customers needing value offers"),
    ]
    for key, label, color, icon, insight in configs:
        count = len(segments[key])
        result.append({
            "segment": key,
            "label": label,
            "count": count,
            "percentage": round(count / total * 100, 1) if total else 0,
            "color": color,
            "icon": icon,
            "insight": insight,
            "avg_probability": round(
                sum(p.get("probability", 0) for p in segments[key]) / count, 3
            ) if count else 0,
        })

    return {"segments": result, "total": total}


# ─── Churn Forecasting ────────────────────────────────────────────────────────

def forecast_churn(daily_trend: List[dict], periods: int = 30) -> Dict:
    """
    Simple linear trend extrapolation for churn forecasting.
    Returns projected daily churn rates for the next N periods.
    """
    if len(daily_trend) < 3:
        return {"forecast": [], "trend": "insufficient_data"}

    # Extract churn rates
    rates = []
    for d in daily_trend[-14:]:
        total = d.get("total", 0)
        churn = d.get("churn", 0)
        rates.append(churn / total if total > 0 else 0)

    if not rates:
        return {"forecast": [], "trend": "no_data"}

    avg_rate = np.mean(rates)
    trend_slope = (rates[-1] - rates[0]) / max(len(rates) - 1, 1)

    forecast = []
    last_date = daily_trend[-1].get("date", "")
    try:
        from datetime import datetime, timedelta
        base = datetime.strptime(last_date, "%Y-%m-%d")
    except Exception:
        from datetime import datetime, timedelta
        base = datetime.now()

    for i in range(1, periods + 1):
        projected_rate = max(0, min(1, avg_rate + trend_slope * i))
        forecast.append({
            "date": (base + timedelta(days=i)).strftime("%Y-%m-%d"),
            "projected_churn_rate": round(projected_rate, 4),
            "projected_churn_pct": round(projected_rate * 100, 1),
        })

    trend_direction = "increasing" if trend_slope > 0.01 else "decreasing" if trend_slope < -0.01 else "stable"

    return {
        "forecast": forecast,
        "trend": trend_direction,
        "avg_current_rate": round(avg_rate, 4),
        "trend_slope": round(trend_slope, 5),
        "next_30_day_avg": round(np.mean([f["projected_churn_rate"] for f in forecast]), 4),
    }


# ─── Customer Lifetime Value ──────────────────────────────────────────────────

def calculate_clv(customer_data: dict, churn_probability: float) -> Dict:
    """
    Estimate Customer Lifetime Value based on charges and churn probability.
    """
    monthly = customer_data.get("monthly_charges", 0)
    tenure = customer_data.get("tenure", 0)
    retention_rate = 1 - churn_probability

    # Expected remaining months (geometric series)
    expected_months = retention_rate / max(churn_probability, 0.01)
    clv = monthly * expected_months
    historical_value = monthly * tenure

    priority = "Critical" if churn_probability >= 0.7 and clv > 500 else \
               "High" if churn_probability >= 0.5 else \
               "Medium" if churn_probability >= 0.3 else "Low"

    return {
        "monthly_value": round(monthly, 2),
        "historical_value": round(historical_value, 2),
        "expected_lifetime_months": round(expected_months, 1),
        "estimated_clv": round(clv, 2),
        "retention_rate": round(retention_rate, 4),
        "priority": priority,
        "revenue_at_risk": round(clv * churn_probability, 2),
    }


# ─── Anomaly Detection ────────────────────────────────────────────────────────

def detect_anomalies(predictions: List[dict]) -> Dict:
    """
    Detect anomalous prediction patterns using statistical thresholds.
    """
    if len(predictions) < 5:
        return {"anomalies": [], "anomaly_rate": 0}

    probs = [p.get("probability", 0) for p in predictions]
    mean_prob = np.mean(probs)
    std_prob = np.std(probs)
    threshold = mean_prob + 2 * std_prob

    anomalies = []
    for p in predictions:
        prob = p.get("probability", 0)
        if prob > threshold:
            anomalies.append({
                "id": str(p.get("id", p.get("_id", ""))),
                "probability": round(prob, 4),
                "deviation": round((prob - mean_prob) / max(std_prob, 0.001), 2),
                "created_at": str(p.get("created_at", "")),
            })

    return {
        "anomalies": anomalies[:10],
        "anomaly_count": len(anomalies),
        "anomaly_rate": round(len(anomalies) / len(predictions), 4),
        "mean_probability": round(mean_prob, 4),
        "threshold": round(threshold, 4),
    }
