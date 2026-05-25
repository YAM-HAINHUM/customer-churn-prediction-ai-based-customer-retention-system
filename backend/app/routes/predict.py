"""
Prediction routes: run churn prediction and store results in MongoDB.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone
from bson import ObjectId
import logging

from ..models.schemas import PredictionRequest, PredictionResponse, MessageResponse
from ..services import ml_service
from ..services.auth_service import get_user_by_id
from ..database import get_database
from ..utils.helpers import serialize_doc
from .auth import get_current_user
import os, json

router = APIRouter(prefix="/predict", tags=["Predictions"])
logger = logging.getLogger(__name__)


@router.post("", response_model=PredictionResponse, status_code=201)
async def predict_churn(
    body: PredictionRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Accept customer feature data and return a churn prediction.
    Stores the result in MongoDB for history tracking.
    """
    if not ml_service.is_ready():
        raise HTTPException(
            status_code=503,
            detail="ML model is not loaded. Please run the training script first."
        )

    try:
        # Convert Pydantic model to plain dict for ML service
        input_dict = body.customer_data.model_dump()

        # Run prediction
        prediction, probability, confidence, feature_importance = ml_service.predict(input_dict)

        # Persist to MongoDB
        db = get_database()
        doc = {
            "user_id": str(current_user["_id"]),
            "prediction": prediction,
            "probability": round(probability, 4),
            "confidence": confidence,
            "feature_importance": feature_importance,
            "input_data": input_dict,
            "created_at": datetime.now(timezone.utc),
        }
        result = await db.predictions.insert_one(doc)
        doc["_id"] = result.inserted_id

        serialized = serialize_doc(doc)
        serialized["id"] = serialized.pop("_id")
        serialized["input_data"] = body.customer_data

        return PredictionResponse(**serialized)

    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/status")
async def model_status():
    """Check if the ML model is loaded and ready."""
    return {
        "ready": ml_service.is_ready(),
        "message": "Model ready" if ml_service.is_ready() else "Model not loaded. Run ml/train.py"
    }


@router.get("/model/info")
async def model_info():
    """Return ML model metadata: name, type, metrics, and all model comparison results."""
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        meta_path = os.path.join(base_dir, "ml", "artifacts", "metadata.json")
        if not os.path.exists(meta_path):
            return {"error": "Metadata not found. Run ml/train.py first."}
        with open(meta_path) as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Model info error: {e}")
        return {"error": str(e)}
