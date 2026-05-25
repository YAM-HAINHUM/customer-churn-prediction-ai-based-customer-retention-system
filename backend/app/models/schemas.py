"""
Pydantic schemas for request/response validation.
These define the data contracts for all API endpoints.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict, List
from datetime import datetime
from enum import Enum


# ─── Enumerations ────────────────────────────────────────────────────────────

class Gender(str, Enum):
    Male = "Male"
    Female = "Female"

class YesNo(str, Enum):
    Yes = "Yes"
    No = "No"

class MultipleLines(str, Enum):
    Yes = "Yes"
    No = "No"
    NoPhoneService = "No phone service"

class InternetService(str, Enum):
    DSL = "DSL"
    FiberOptic = "Fiber optic"
    No = "No"

class InternetFeature(str, Enum):
    Yes = "Yes"
    No = "No"
    NoInternetService = "No internet service"

class Contract(str, Enum):
    MonthToMonth = "Month-to-month"
    OneYear = "One year"
    TwoYear = "Two year"

class PaymentMethod(str, Enum):
    ElectronicCheck = "Electronic check"
    MailedCheck = "Mailed check"
    BankTransfer = "Bank transfer (automatic)"
    CreditCard = "Credit card (automatic)"

class PredictionLabel(str, Enum):
    Churn = "Churn"
    NotChurn = "Not Churn"

class Confidence(str, Enum):
    High = "High"
    Medium = "Medium"
    Low = "Low"


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Prediction Schemas ───────────────────────────────────────────────────────

class CustomerData(BaseModel):
    """Input features matching the Telco Churn dataset."""
    gender: Gender
    senior_citizen: int = Field(..., ge=0, le=1, description="0 = No, 1 = Yes")
    partner: YesNo
    dependents: YesNo
    tenure: int = Field(..., ge=0, le=100, description="Months as customer")
    phone_service: YesNo
    multiple_lines: MultipleLines
    internet_service: InternetService
    online_security: InternetFeature
    online_backup: InternetFeature
    device_protection: InternetFeature
    tech_support: InternetFeature
    streaming_tv: InternetFeature
    streaming_movies: InternetFeature
    contract: Contract
    paperless_billing: YesNo
    payment_method: PaymentMethod
    monthly_charges: float = Field(..., ge=0, le=500)
    total_charges: float = Field(..., ge=0, le=10000)

    @field_validator('senior_citizen', mode='before')
    @classmethod
    def coerce_senior_citizen(cls, v):
        try:
            return int(v)
        except (ValueError, TypeError):
            raise ValueError('senior_citizen must be 0 or 1')


class PredictionRequest(BaseModel):
    customer_data: CustomerData


class PredictionResponse(BaseModel):
    id: str
    prediction: PredictionLabel
    probability: float = Field(..., ge=0.0, le=1.0)
    confidence: Confidence
    feature_importance: Dict[str, float]
    input_data: CustomerData
    created_at: datetime
    user_id: Optional[str] = None


class PredictionHistoryItem(BaseModel):
    id: str
    prediction: PredictionLabel
    probability: float
    confidence: Confidence
    input_data: CustomerData
    created_at: datetime


class PredictionHistoryResponse(BaseModel):
    items: List[PredictionHistoryItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class InsightsResponse(BaseModel):
    total_predictions: int
    churn_count: int
    not_churn_count: int
    churn_rate: float
    avg_probability: float
    high_risk_count: int
    predictions_today: int
    feature_importance: Dict[str, float]
    daily_trend: List[Dict]
    contract_distribution: List[Dict]
    confidence_distribution: List[Dict]


# ─── Generic Responses ────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    detail: str
