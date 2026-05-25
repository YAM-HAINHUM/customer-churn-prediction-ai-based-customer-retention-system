"""
Advanced analytics routes: retention simulator, XAI explanations,
customer segmentation, churn forecasting, CLV, anomaly detection.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import logging

from ..database import get_database
from ..utils.helpers import serialize_doc
from ..services import ml_service
from ..services.advanced_ml import (
    simulate_retention, get_xai_explanation,
    segment_customers, forecast_churn,
    calculate_clv, detect_anomalies,
)
from ..models.schemas import CustomerData
from .auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Advanced Analytics"])
logger = logging.getLogger(__name__)


class SimulatorRequest(BaseModel):
    customer_data: CustomerData
    actions: List[str]


class XAIRequest(BaseModel):
    customer_data: CustomerData
    probability: float


# ─── Retention Simulator ──────────────────────────────────────────────────────

@router.post("/simulate")
async def retention_simulator(
    body: SimulatorRequest,
    current_user: dict = Depends(get_current_user),
):
    """Simulate retention actions and show before/after churn probability."""
    if not ml_service.is_ready():
        raise HTTPException(status_code=503, detail="ML model not loaded")
    result = simulate_retention(body.customer_data.model_dump(), body.actions)
    return result


@router.get("/simulator/actions")
async def get_simulator_actions():
    """Return available retention actions for the simulator."""
    from ..services.advanced_ml import RETENTION_ACTIONS
    return {
        "actions": [
            {"key": k, "label": v["label"]}
            for k, v in RETENTION_ACTIONS.items()
        ]
    }


# ─── XAI Explanations ─────────────────────────────────────────────────────────

@router.post("/explain")
async def explain_prediction(
    body: XAIRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate SHAP-style explanation for a prediction."""
    explanation = get_xai_explanation(body.customer_data.model_dump(), body.probability)
    return explanation


# ─── Customer Segmentation ────────────────────────────────────────────────────

@router.get("/segments")
async def customer_segments(current_user: dict = Depends(get_current_user)):
    """Segment predictions into customer groups."""
    db = get_database()
    docs = await db.predictions.find(
        {"user_id": str(current_user["_id"])}
    ).to_list(length=None)

    serialized = [serialize_doc(d) for d in docs]
    result = segment_customers(serialized)
    return result


# ─── Churn Forecasting ────────────────────────────────────────────────────────

@router.get("/forecast")
async def churn_forecast(
    periods: int = 30,
    current_user: dict = Depends(get_current_user),
):
    """Forecast future churn rates based on historical trend."""
    db = get_database()
    docs = await db.predictions.find(
        {"user_id": str(current_user["_id"])}
    ).to_list(length=None)

    # Build daily trend
    thirty_days_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
    daily: dict = defaultdict(lambda: {"date": "", "total": 0, "churn": 0})
    for d in docs:
        dt = d.get("created_at")
        if dt:
            dt_naive = dt.replace(tzinfo=None) if dt.tzinfo else dt
            if dt_naive >= thirty_days_ago:
                day_key = dt_naive.strftime("%Y-%m-%d")
                daily[day_key]["date"] = day_key
                daily[day_key]["total"] += 1
                if d.get("prediction") == "Churn":
                    daily[day_key]["churn"] += 1

    daily_trend = sorted(daily.values(), key=lambda x: x["date"])
    return forecast_churn(daily_trend, periods=min(periods, 90))


# ─── CLV Calculation ──────────────────────────────────────────────────────────

@router.post("/clv")
async def customer_lifetime_value(
    body: XAIRequest,
    current_user: dict = Depends(get_current_user),
):
    """Calculate Customer Lifetime Value."""
    clv = calculate_clv(body.customer_data.model_dump(), body.probability)
    return clv


# ─── Anomaly Detection ────────────────────────────────────────────────────────

@router.get("/anomalies")
async def anomaly_detection(current_user: dict = Depends(get_current_user)):
    """Detect anomalous prediction patterns."""
    db = get_database()
    docs = await db.predictions.find(
        {"user_id": str(current_user["_id"])}
    ).to_list(length=None)
    serialized = [serialize_doc(d) for d in docs]
    return detect_anomalies(serialized)


# ─── Revenue Impact ───────────────────────────────────────────────────────────

@router.get("/revenue")
async def revenue_impact(current_user: dict = Depends(get_current_user)):
    """Calculate revenue impact metrics from prediction history."""
    db = get_database()
    docs = await db.predictions.find(
        {"user_id": str(current_user["_id"])}
    ).to_list(length=None)

    if not docs:
        return {
            "total_revenue_at_risk": 0, "monthly_loss_estimate": 0,
            "high_risk_revenue": 0, "avg_customer_value": 0,
            "potential_savings": 0, "customers_analyzed": 0,
        }

    total_at_risk = 0
    high_risk_revenue = 0
    monthly_values = []

    for d in docs:
        inp = d.get("input_data", {})
        prob = d.get("probability", 0)
        charges = inp.get("monthly_charges", 0) if isinstance(inp, dict) else 0
        monthly_values.append(charges)
        revenue_at_risk = charges * prob * 12  # annualized
        total_at_risk += revenue_at_risk
        if prob >= 0.7:
            high_risk_revenue += charges * 12

    avg_value = sum(monthly_values) / len(monthly_values) if monthly_values else 0

    return {
        "total_revenue_at_risk": round(total_at_risk, 2),
        "monthly_loss_estimate": round(total_at_risk / 12, 2),
        "high_risk_revenue": round(high_risk_revenue, 2),
        "avg_customer_value": round(avg_value * 12, 2),
        "potential_savings": round(total_at_risk * 0.35, 2),  # 35% retention success estimate
        "customers_analyzed": len(docs),
    }


# ─── Model Comparison ─────────────────────────────────────────────────────────

@router.get("/models/compare")
async def compare_models():
    """Return model comparison results from training metadata."""
    import os, json
    routes_dir = os.path.dirname(os.path.abspath(__file__))
    app_dir = os.path.dirname(routes_dir)
    backend_dir = os.path.dirname(app_dir)
    meta_path = os.path.join(backend_dir, "ml", "artifacts", "metadata.json")

    if not os.path.exists(meta_path):
        return {"error": "No metadata found. Run ml/train.py first."}

    with open(meta_path) as f:
        meta = json.load(f)

    return {
        "best_model": meta.get("model_name"),
        "best_metrics": meta.get("test_metrics", {}),
        "all_results": meta.get("all_results", []),
        "feature_count": meta.get("feature_count"),
        "trained_at": meta.get("trained_at"),
    }


# ─── Sentiment Analysis (rule-based) ─────────────────────────────────────────

class SentimentRequest(BaseModel):
    text: str


NEGATIVE_WORDS = {
    "terrible", "awful", "horrible", "bad", "worst", "hate", "angry",
    "frustrated", "disappointed", "useless", "broken", "slow", "expensive",
    "overpriced", "cancel", "leaving", "quit", "unsubscribe", "refund",
    "complaint", "issue", "problem", "error", "fail", "poor", "unhappy",
}
POSITIVE_WORDS = {
    "great", "excellent", "amazing", "love", "perfect", "best", "happy",
    "satisfied", "wonderful", "fantastic", "good", "helpful", "fast",
    "reliable", "recommend", "awesome", "brilliant",
}


@router.post("/sentiment")
async def analyze_sentiment(
    body: SentimentRequest,
    current_user: dict = Depends(get_current_user),
):
    """Rule-based sentiment analysis for customer feedback."""
    words = set(body.text.lower().split())
    neg_hits = words & NEGATIVE_WORDS
    pos_hits = words & POSITIVE_WORDS

    neg_score = len(neg_hits)
    pos_score = len(pos_hits)
    total = neg_score + pos_score

    if total == 0:
        sentiment = "Neutral"
        score = 0.5
    elif neg_score > pos_score:
        sentiment = "Negative"
        score = round(neg_score / total, 3)
    else:
        sentiment = "Positive"
        score = round(pos_score / total, 3)

    churn_risk = neg_score >= 2

    return {
        "sentiment": sentiment,
        "score": score,
        "negative_keywords": list(neg_hits),
        "positive_keywords": list(pos_hits),
        "churn_risk_signal": churn_risk,
        "recommendation": "Immediate outreach recommended" if churn_risk else "Monitor customer",
    }
