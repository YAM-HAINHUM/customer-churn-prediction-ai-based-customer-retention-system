"""
History routes: fetch, delete prediction history, get insights, and export CSV.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from collections import defaultdict
import csv
import io
import logging

from ..models.schemas import (
    PredictionHistoryResponse, PredictionHistoryItem,
    InsightsResponse, MessageResponse
)
from ..database import get_database
from ..utils.helpers import serialize_doc, paginate
from .auth import get_current_user
from ..services import ml_service

router = APIRouter(prefix="/history", tags=["History"])
logger = logging.getLogger(__name__)


@router.get("", response_model=PredictionHistoryResponse)
async def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """Fetch paginated prediction history for the authenticated user."""
    db = get_database()
    user_id = str(current_user["_id"])

    cursor = db.predictions.find(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    docs = await cursor.to_list(length=None)

    items = []
    for doc in docs:
        serialized = serialize_doc(doc)
        serialized["id"] = serialized.pop("_id", serialized.get("id", ""))
        items.append(PredictionHistoryItem(**serialized))

    paged = paginate(items, page, page_size)
    return PredictionHistoryResponse(**paged)


@router.delete("/{record_id}", response_model=MessageResponse)
async def delete_record(
    record_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a specific prediction record (owner only)."""
    db = get_database()
    try:
        result = await db.predictions.delete_one({
            "_id": ObjectId(record_id),
            "user_id": str(current_user["_id"])
        })
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"message": "Prediction record deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/export/csv")
async def export_csv(current_user: dict = Depends(get_current_user)):
    """Download all prediction history as a CSV file."""
    db = get_database()
    docs = await db.predictions.find(
        {"user_id": str(current_user["_id"])},
        sort=[("created_at", -1)]
    ).to_list(length=None)

    output = io.StringIO()
    fieldnames = [
        "id", "prediction", "probability", "confidence", "created_at",
        "tenure", "monthly_charges", "total_charges", "contract",
        "internet_service", "payment_method", "gender", "senior_citizen",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()

    for doc in docs:
        s = serialize_doc(doc)
        input_data = s.get("input_data", {})
        row = {
            "id": s.get("_id", ""),
            "prediction": s.get("prediction", ""),
            "probability": s.get("probability", ""),
            "confidence": s.get("confidence", ""),
            "created_at": s.get("created_at", ""),
            **{k: input_data.get(k, "") for k in [
                "tenure", "monthly_charges", "total_charges", "contract",
                "internet_service", "payment_method", "gender", "senior_citizen"
            ]}
        }
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=prediction_history.csv"}
    )


@router.get("/insights/summary", response_model=InsightsResponse)
async def get_insights(current_user: dict = Depends(get_current_user)):
    """Aggregated analytics and insights for the dashboard."""
    db = get_database()
    user_id = str(current_user["_id"])

    docs = await db.predictions.find({"user_id": user_id}).to_list(length=None)

    if not docs:
        return InsightsResponse(
            total_predictions=0,
            churn_count=0,
            not_churn_count=0,
            churn_rate=0.0,
            avg_probability=0.0,
            high_risk_count=0,
            predictions_today=0,
            feature_importance={},
            daily_trend=[],
            contract_distribution=[],
            confidence_distribution=[],
        )

    total = len(docs)
    churn_docs = [d for d in docs if d.get("prediction") == "Churn"]
    churn_count = len(churn_docs)
    not_churn_count = total - churn_count
    avg_prob = sum(d.get("probability", 0) for d in docs) / total if total else 0
    high_risk = sum(1 for d in docs if d.get("probability", 0) >= 0.7)

    today = datetime.now(timezone.utc).date()
    preds_today = sum(
        1 for d in docs
        if d.get("created_at") and (
            d["created_at"].replace(tzinfo=timezone.utc)
            if d["created_at"].tzinfo is None
            else d["created_at"]
        ).date() == today
    )

    # Daily trend (last 30 days)
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

    # Contract distribution
    contract_map: dict = defaultdict(lambda: {"contract": "", "churn": 0, "total": 0})
    for d in docs:
        contract = d.get("input_data", {}).get("contract", "Unknown")
        contract_map[contract]["contract"] = contract
        contract_map[contract]["total"] += 1
        if d.get("prediction") == "Churn":
            contract_map[contract]["churn"] += 1
    contract_distribution = list(contract_map.values())

    # Confidence distribution
    conf_map: dict = defaultdict(int)
    for d in docs:
        conf_map[d.get("confidence", "Unknown")] += 1
    confidence_distribution = [
        {"confidence": k, "count": v} for k, v in conf_map.items()
    ]

    return InsightsResponse(
        total_predictions=total,
        churn_count=churn_count,
        not_churn_count=not_churn_count,
        churn_rate=round(churn_count / total, 4) if total else 0.0,
        avg_probability=round(avg_prob, 4),
        high_risk_count=high_risk,
        predictions_today=preds_today,
        feature_importance=ml_service._get_feature_importance(10) if ml_service.is_ready() else {},
        daily_trend=daily_trend,
        contract_distribution=contract_distribution,
        confidence_distribution=confidence_distribution,
    )
