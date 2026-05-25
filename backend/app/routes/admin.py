"""
Admin routes: system statistics, user management overview, model retraining.
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import subprocess
import sys
import os
import logging

from ..database import get_database
from .auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


@router.get("/stats")
async def admin_stats(current_user: dict = Depends(get_current_user)):
    """Aggregate system-wide statistics for the admin panel."""
    db = get_database()

    # All predictions (system-wide)
    all_preds = await db.predictions.find({}).to_list(length=None)
    all_users = await db.users.find({}).to_list(length=None)

    total_preds = len(all_preds)
    churn_preds = sum(1 for p in all_preds if p.get("prediction") == "Churn")
    high_risk = sum(1 for p in all_preds if p.get("probability", 0) >= 0.7)

    # Predictions per day (last 7 days)
    seven_days_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=7)
    daily: dict = defaultdict(int)
    for p in all_preds:
        dt = p.get("created_at")
        if dt:
            dt_naive = dt.replace(tzinfo=None) if dt.tzinfo else dt
            if dt_naive >= seven_days_ago:
                daily[dt_naive.strftime("%Y-%m-%d")] += 1
    daily_activity = [{"date": k, "count": v} for k, v in sorted(daily.items())]

    # Per-user prediction counts
    user_pred_counts: dict = defaultdict(int)
    for p in all_preds:
        user_pred_counts[p.get("user_id", "unknown")] += 1

    # Model artifact info
    routes_dir  = os.path.dirname(os.path.abspath(__file__))
    app_dir     = os.path.dirname(routes_dir)
    backend_dir = os.path.dirname(app_dir)
    meta_path   = os.path.join(backend_dir, "ml", "artifacts", "metadata.json")
    model_info = {}
    if os.path.exists(meta_path):
        import json
        with open(meta_path) as f:
            model_info = json.load(f)

    return {
        "total_users": len(all_users),
        "total_predictions": total_preds,
        "churn_predictions": churn_preds,
        "not_churn_predictions": total_preds - churn_preds,
        "high_risk_count": high_risk,
        "churn_rate": round(churn_preds / total_preds, 4) if total_preds else 0,
        "daily_activity": daily_activity,
        "active_users": len(user_pred_counts),
        "model_info": model_info,
        "system": {
            "python_version": sys.version.split()[0],
            "platform": sys.platform,
        },
    }


@router.post("/retrain")
async def retrain_model(current_user: dict = Depends(get_current_user)):
    """Trigger ML model retraining in the background."""
    try:
        # backend/app/routes/admin.py -> go up 3 levels to reach backend/
        # then one more to reach project root
        routes_dir  = os.path.dirname(os.path.abspath(__file__))   # backend/app/routes
        app_dir     = os.path.dirname(routes_dir)                   # backend/app
        backend_dir = os.path.dirname(app_dir)                      # backend
        base_dir    = os.path.dirname(backend_dir)                  # project root

        train_script = os.path.join(backend_dir, "ml", "train.py")
        if not os.path.exists(train_script):
            raise HTTPException(
                status_code=404,
                detail=f"Training script not found at: {train_script}"
            )

        subprocess.Popen(
            [sys.executable, "-m", "ml.train"],
            cwd=backend_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return {"message": "Model retraining started in background", "status": "running"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Retrain error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
