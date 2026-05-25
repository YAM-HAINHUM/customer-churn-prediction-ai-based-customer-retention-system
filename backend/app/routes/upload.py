"""
CSV bulk upload route: accept a CSV file, run predictions on all rows,
return results as JSON and allow CSV download.
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
import pandas as pd
import numpy as np
import io
import csv
import logging

from ..services import ml_service
from .auth import get_current_user

router = APIRouter(prefix="/upload", tags=["Upload"])
logger = logging.getLogger(__name__)

REQUIRED_COLS = {
    "gender", "senior_citizen", "partner", "dependents", "tenure",
    "phone_service", "multiple_lines", "internet_service", "online_security",
    "online_backup", "device_protection", "tech_support", "streaming_tv",
    "streaming_movies", "contract", "paperless_billing", "payment_method",
    "monthly_charges", "total_charges",
}

# Map original Telco CSV column names → snake_case
COL_ALIASES = {
    "SeniorCitizen":    "senior_citizen",
    "PhoneService":     "phone_service",
    "MultipleLines":    "multiple_lines",
    "InternetService":  "internet_service",
    "OnlineSecurity":   "online_security",
    "OnlineBackup":     "online_backup",
    "DeviceProtection": "device_protection",
    "TechSupport":      "tech_support",
    "StreamingTV":      "streaming_tv",
    "StreamingMovies":  "streaming_movies",
    "Contract":         "contract",
    "PaperlessBilling": "paperless_billing",
    "PaymentMethod":    "payment_method",
    "MonthlyCharges":   "monthly_charges",
    "TotalCharges":     "total_charges",
    "Gender":           "gender",
    "Partner":          "partner",
    "Dependents":       "dependents",
    "Tenure":           "tenure",
    "tenure":           "tenure",
}

# Default fallback values for missing/NaN fields
DEFAULTS = {
    "gender": "Male", "senior_citizen": 0, "partner": "No",
    "dependents": "No", "tenure": 0, "phone_service": "Yes",
    "multiple_lines": "No", "internet_service": "Fiber optic",
    "online_security": "No", "online_backup": "No",
    "device_protection": "No", "tech_support": "No",
    "streaming_tv": "No", "streaming_movies": "No",
    "contract": "Month-to-month", "paperless_billing": "Yes",
    "payment_method": "Electronic check",
    "monthly_charges": 0.0, "total_charges": 0.0,
}


def _safe_float(val, default=0.0):
    """Convert value to float, returning default on blank/NaN."""
    try:
        if val is None or (isinstance(val, float) and np.isnan(val)):
            return default
        s = str(val).strip()
        return float(s) if s else default
    except (ValueError, TypeError):
        return default


def _safe_int(val, default=0):
    return int(_safe_float(val, default))


def _build_row_dict(row: dict) -> dict:
    """Build a clean prediction-ready dict from a CSV row."""
    d = {}
    for col in REQUIRED_COLS:
        raw = row.get(col, DEFAULTS.get(col))
        if raw is None or (isinstance(raw, float) and np.isnan(raw)):
            raw = DEFAULTS.get(col)
        d[col] = raw

    d["senior_citizen"] = _safe_int(d["senior_citizen"])
    d["tenure"]         = _safe_int(d["tenure"])
    d["monthly_charges"] = _safe_float(d["monthly_charges"])
    d["total_charges"]   = _safe_float(d["total_charges"])

    # Clamp to schema bounds
    d["tenure"]          = max(0, min(100, d["tenure"]))
    d["monthly_charges"] = max(0.0, min(500.0, d["monthly_charges"]))
    d["total_charges"]   = max(0.0, min(10000.0, d["total_charges"]))

    return d


def _load_and_normalize(content: bytes) -> pd.DataFrame:
    """Read CSV bytes, rename columns, lowercase all column names."""
    df = pd.read_csv(io.BytesIO(content))
    df = df.rename(columns=COL_ALIASES)
    df.columns = [c.lower().strip() for c in df.columns]
    # The real Telco dataset has TotalCharges as string with spaces
    if "total_charges" in df.columns:
        df["total_charges"] = pd.to_numeric(df["total_charges"], errors="coerce").fillna(0.0)
    return df


@router.post("/predict")
async def bulk_predict(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if not ml_service.is_ready():
        raise HTTPException(status_code=503, detail="ML model not loaded. Run ml/train.py first.")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail=f"Only CSV files are supported. Got: '{file.filename}'")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    try:
        df = _load_and_normalize(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Missing required columns: {', '.join(sorted(missing))}. "
                f"Found columns: {', '.join(sorted(df.columns))}. "
                f"Tip: use the original Telco CSV or rename columns to snake_case."
            )
        )

    results, errors = [], []
    for idx, row in df.iterrows():
        try:
            row_dict = _build_row_dict(row.to_dict())
            prediction, probability, confidence, _ = ml_service.predict(row_dict)
            results.append({
                "row":          idx + 1,
                "prediction":   prediction,
                "probability":  round(probability, 4),
                "confidence":   confidence,
                "risk_level":   "High" if probability >= 0.7 else "Medium" if probability >= 0.4 else "Low",
                "tenure":       row_dict["tenure"],
                "monthly_charges": row_dict["monthly_charges"],
                "contract":     row_dict.get("contract", ""),
                "internet_service": row_dict.get("internet_service", ""),
            })
        except Exception as e:
            logger.warning(f"Row {idx + 1} prediction failed: {e}")
            errors.append({"row": idx + 1, "error": str(e)})

    churn_count = sum(1 for r in results if r["prediction"] == "Churn")
    return {
        "total_rows":     len(df),
        "processed":      len(results),
        "errors":         len(errors),
        "churn_count":    churn_count,
        "not_churn_count": len(results) - churn_count,
        "churn_rate":     round(churn_count / len(results), 4) if results else 0,
        "results":        results,
        "error_details":  errors,
    }


@router.post("/predict/download")
async def bulk_predict_download(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Same as bulk_predict but streams a CSV file back."""
    if not ml_service.is_ready():
        raise HTTPException(status_code=503, detail="ML model not loaded.")

    content = await file.read()
    try:
        df = _load_and_normalize(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    output = io.StringIO()
    fieldnames = ["row", "prediction", "probability", "confidence", "risk_level",
                  "tenure", "monthly_charges", "contract", "internet_service"]
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()

    for idx, row in df.iterrows():
        try:
            row_dict = _build_row_dict(row.to_dict())
            prediction, probability, confidence, _ = ml_service.predict(row_dict)
            writer.writerow({
                "row": idx + 1, "prediction": prediction,
                "probability": round(probability, 4), "confidence": confidence,
                "risk_level": "High" if probability >= 0.7 else "Medium" if probability >= 0.4 else "Low",
                "tenure": row_dict["tenure"],
                "monthly_charges": row_dict["monthly_charges"],
                "contract": row_dict.get("contract", ""),
                "internet_service": row_dict.get("internet_service", ""),
            })
        except Exception as e:
            writer.writerow({
                "row": idx + 1, "prediction": "ERROR",
                "probability": "", "confidence": "", "risk_level": "",
                "tenure": "", "monthly_charges": "", "contract": "", "internet_service": "",
            })

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bulk_predictions.csv"},
    )
