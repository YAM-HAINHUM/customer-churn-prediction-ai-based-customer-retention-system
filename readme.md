# ChurnPredictor — Customer Churn Prediction System

> A production-ready, full-stack AI web application that predicts customer churn using machine learning, with real-time analytics, JWT authentication, and a visually distinct multi-page UI.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Business Problem](#business-problem)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [UI Design System](#ui-design-system)
6. [Project Structure](#project-structure)
7. [Setup Instructions](#setup-instructions)
8. [API Documentation](#api-documentation)
9. [ML Pipeline](#ml-pipeline)
10. [Environment Variables](#environment-variables)
11. [Docker Deployment](#docker-deployment)
12. [Cloud Deployment](#cloud-deployment)
13. [Security](#security)
14. [Future Improvements](#future-improvements)

---

## Project Overview

ChurnPredictor is a full-stack web application that:

- Accepts 19 customer features (demographics, services, billing) via a form
- Runs a trained ML model (Random Forest / Logistic Regression) to predict churn probability
- Returns a prediction label, probability score, confidence level, and feature importance
- Stores all predictions per user in MongoDB
- Provides analytics dashboards with charts, trends, and model performance metrics
- Supports JWT-based email authentication with bcrypt password hashing

---

## Business Problem

**Customer churn** is when a customer stops using a product or service. Predicting churn before it happens allows businesses to take proactive retention actions.

### Industry Impact

| Industry  | Avg Churn Cost         | Retention Benefit                  |
|-----------|------------------------|------------------------------------|
| Telecom   | $300–$400 per customer | Targeted offers, contract upgrades |
| SaaS      | 5–7% MRR loss/month    | Feature improvements, outreach     |
| Banking   | $150–$200 per customer | Loyalty programs, fee waivers      |

**Key insight:** Acquiring a new customer costs 5–7× more than retaining an existing one. A 5% reduction in churn can increase profits by 25–95%.

---

## Tech Stack

| Layer          | Technology                                                  |
|----------------|-------------------------------------------------------------|
| **Frontend**   | React 19, Vite 8, React Router 7, React Hook Form           |
| **Styling**    | Tailwind CSS v4, custom CSS design tokens                   |
| **Charts**     | Recharts 3                                                  |
| **HTTP Client**| Axios                                                       |
| **Backend**    | FastAPI 0.115, Python 3.11+                                 |
| **Database**   | MongoDB 7 (Motor async driver)                              |
| **ML**         | scikit-learn 1.6 (Random Forest, Logistic Regression, SVM, Decision Tree) |
| **Auth**       | JWT (python-jose) + bcrypt (passlib)                        |
| **Validation** | Pydantic v2                                                 |
| **Container**  | Docker + Docker Compose                                     |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  React SPA (Vite)  ←→  Axios  ←→  /api/*                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON
┌──────────────────────────▼──────────────────────────────────┐
│                    FastAPI Backend                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │  /auth   │  │ /predict │  │        /history          │  │
│  │ register │  │  POST    │  │  GET / DELETE / CSV      │  │
│  │  login   │  │  status  │  │  insights/summary        │  │
│  │   /me    │  │ model/info│  │                          │  │
│  └────┬─────┘  └────┬─────┘  └────────────┬─────────────┘  │
│       │             │                      │                 │
│  ┌────▼─────────────▼──────────────────────▼─────────────┐  │
│  │              Services Layer                            │  │
│  │  auth_service.py  │  ml_service.py                    │  │
│  │  (JWT, bcrypt)    │  (joblib, sklearn, pandas)        │  │
│  └────┬──────────────┴──────────────────────────────────┘  │
│       │                                                      │
│  ┌────▼──────────────────────────────────────────────────┐  │
│  │              MongoDB (Motor async)                     │  │
│  │   users collection  │  predictions collection         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow — Prediction Request

```
User fills form → React validates → POST /api/predict
  → JWT verified → CustomerData parsed by Pydantic
  → ml_service.predict() → preprocess → model.predict_proba()
  → result saved to MongoDB → PredictionResponse returned
  → React displays result + feature importance chart
```

---

## UI Design System

Each page has a **distinct visual identity**:

| Page              | Style                  | Key Elements                                    |
|-------------------|------------------------|-------------------------------------------------|
| **Login/Register**| Glassmorphism          | Animated orbs, blur card, grid bg, float logo   |
| **Dashboard**     | Corporate UI           | KPI band, stat cards, trend + donut charts      |
| **Predict**       | Professional Form      | Multi-section form, risk meter, feature chart   |
| **Insights**      | Dark Analytics         | Glow stats, dark chart cards, top-line bar      |
| **History**       | Light Data Grid        | Adaptive table, mini bars, search, pagination   |

### Design Tokens

```css
--color-primary:    #1E6FFF   /* Brand blue */
--color-accent:     #00C6FF   /* Cyan accent */
--color-success:    #10B981   /* Green */
--color-warning:    #F59E0B   /* Amber */
--color-danger:     #EF4444   /* Red */
--color-bg-base:    #0B0F1A   /* Dark background */
--font-mono:        JetBrains Mono / Cascadia Code
```

---

## Project Structure

```
Customer Churn Prediction/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic request/response models
│   │   ├── routes/
│   │   │   ├── auth.py             # POST /api/auth/register, /login, GET /me
│   │   │   ├── predict.py          # POST /api/predict, GET /status, /model/info
│   │   │   └── history.py          # GET /api/history, insights, export CSV
│   │   ├── services/
│   │   │   ├── auth_service.py     # bcrypt hashing, JWT creation/decode
│   │   │   └── ml_service.py       # Model loading, preprocessing, prediction
│   │   ├── utils/
│   │   │   └── helpers.py          # MongoDB serialization, pagination
│   │   ├── config.py               # Pydantic Settings (env vars)
│   │   ├── database.py             # Motor async MongoDB client + indexes
│   │   └── main.py                 # FastAPI app, CORS, lifespan
│   ├── ml/
│   │   ├── train.py                # Full ML training pipeline
│   │   ├── artifacts/              # Saved model, scaler, encoders, metadata
│   │   └── plots/                  # EDA visualizations (auto-generated)
│   ├── data/
│   │   └── WA_Fn-UseC_-Telco-Customer-Churn.csv
│   ├── .env                        # Environment variables (not committed)
│   ├── .env.example                # Template for environment variables
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js           # Axios instance + JWT interceptors
│   │   │   ├── auth.js             # Auth API calls
│   │   │   └── predictions.js      # Predictions, history, insights API calls
│   │   ├── components/
│   │   │   ├── charts/             # Recharts: trend, donut, bar, feature importance
│   │   │   ├── layout/             # AppLayout, Sidebar, Header
│   │   │   └── ui/                 # Badge, StatCard, Toast, LoadingSpinner
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # JWT token + user state
│   │   │   ├── ThemeContext.jsx    # Dark/light mode toggle
│   │   │   └── ToastContext.jsx    # Global toast notifications
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Glassmorphism auth page
│   │   │   ├── Register.jsx        # Glassmorphism register page
│   │   │   ├── Dashboard.jsx       # Corporate KPI dashboard
│   │   │   ├── Predict.jsx         # Prediction form + result panel
│   │   │   ├── History.jsx         # Light data-grid table
│   │   │   └── Insights.jsx        # Dark analytics charts
│   │   ├── utils/format.js         # Date, number, percentage formatters
│   │   ├── App.jsx                 # Routes + PrivateRoute guard
│   │   └── index.css               # Design tokens + component styles
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js              # Dev proxy → backend :8000
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB 6+ (local) or MongoDB Atlas (cloud)

---

### 1. Clone & Navigate

```bash
git clone <your-repo-url>
cd "Customer Churn Prediction"
```

---

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt
```

---

### 3. Configure Environment

Copy the example and edit:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
APP_NAME=ChurnPredictor API
APP_VERSION=1.0.0
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=churn_predictor

MODEL_PATH=ml/artifacts/best_model.pkl
SCALER_PATH=ml/artifacts/scaler.pkl
ENCODER_PATH=ml/artifacts/encoders.pkl
FEATURE_NAMES_PATH=ml/artifacts/feature_names.pkl
```

---

### 4. Train the ML Model

```bash
# From the backend/ directory
cd backend
python -m ml.train
```

**What this does:**
- Loads `data/WA_Fn-UseC_-Telco-Customer-Churn.csv` (or generates synthetic data)
- Runs EDA and saves plots to `ml/plots/`
- Trains 4 models: Logistic Regression, Decision Tree, Random Forest, SVM
- Evaluates each with Accuracy, Precision, Recall, F1, ROC-AUC
- Tunes the best model with `RandomizedSearchCV`
- Saves artifacts to `ml/artifacts/`:
  - `best_model.pkl` — trained model
  - `scaler.pkl` — StandardScaler
  - `encoders.pkl` — LabelEncoders for binary columns
  - `feature_names.pkl` — ordered feature list
  - `metadata.json` — model name, type, metrics, all results

---

### 5. Start the Backend

```bash
# From the project root
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

### 6. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

The Vite dev server proxies `/api/*` → `http://localhost:8000`.

---

## API Documentation

### Authentication

#### `POST /api/auth/register`
Register a new user.

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Response `201`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

#### `POST /api/auth/login`
Authenticate and receive a JWT token.

**Request:**
```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Response `200`:** Same as register response.

---

#### `GET /api/auth/me`
Get current user profile. Requires `Authorization: Bearer <token>`.

**Response `200`:**
```json
{
  "id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### Predictions

#### `POST /api/predict`
Run a churn prediction. Requires auth.

**Request:**
```json
{
  "customer_data": {
    "gender": "Male",
    "senior_citizen": 0,
    "partner": "No",
    "dependents": "No",
    "tenure": 12,
    "phone_service": "Yes",
    "multiple_lines": "No",
    "internet_service": "Fiber optic",
    "online_security": "No",
    "online_backup": "No",
    "device_protection": "No",
    "tech_support": "No",
    "streaming_tv": "No",
    "streaming_movies": "No",
    "contract": "Month-to-month",
    "paperless_billing": "Yes",
    "payment_method": "Electronic check",
    "monthly_charges": 65.50,
    "total_charges": 786.00
  }
}
```

**Response `201`:**
```json
{
  "id": "64f1a2b3c4d5e6f7a8b9c0d2",
  "prediction": "Churn",
  "probability": 0.7823,
  "confidence": "High",
  "feature_importance": {
    "Tenure (months)": 100.0,
    "Month-to-Month Contract": 87.3,
    "Monthly Charges": 72.1,
    "Electronic Check": 45.6,
    "Fiber Optic": 38.2
  },
  "input_data": { "...": "..." },
  "created_at": "2024-01-15T10:35:00Z",
  "user_id": "64f1a2b3c4d5e6f7a8b9c0d1"
}
```

---

#### `GET /api/predict/status`
Check if the ML model is loaded.

**Response `200`:**
```json
{ "ready": true, "message": "Model ready" }
```

---

#### `GET /api/predict/model/info`
Get ML model metadata and comparison results.

**Response `200`:**
```json
{
  "model_name": "Tuned Random Forest",
  "model_type": "RandomForestClassifier",
  "feature_count": 40,
  "test_metrics": {
    "accuracy": 0.8012,
    "precision": 0.6734,
    "recall": 0.7123,
    "f1_score": 0.6923,
    "roc_auc": 0.8891
  },
  "all_results": [
    { "model": "Logistic Regression", "roc_auc": 0.8221, "..." },
    { "model": "Random Forest",       "roc_auc": 0.8762, "..." }
  ]
}
```

---

### History

#### `GET /api/history`
Paginated prediction history. Requires auth.

**Query params:** `page=1`, `page_size=10`

**Response `200`:**
```json
{
  "items": [ { "id": "...", "prediction": "Churn", "probability": 0.78, "..." } ],
  "total": 42,
  "page": 1,
  "page_size": 10,
  "total_pages": 5
}
```

---

#### `DELETE /api/history/{record_id}`
Delete a prediction record. Requires auth (owner only).

**Response `200`:**
```json
{ "message": "Prediction record deleted" }
```

---

#### `GET /api/history/export/csv`
Download all history as CSV. Requires auth.

**Response:** `text/csv` file download.

---

#### `GET /api/history/insights/summary`
Aggregated analytics. Requires auth.

**Response `200`:**
```json
{
  "total_predictions": 42,
  "churn_count": 18,
  "not_churn_count": 24,
  "churn_rate": 0.4286,
  "avg_probability": 0.5123,
  "high_risk_count": 12,
  "predictions_today": 3,
  "feature_importance": { "Tenure (months)": 100.0, "...": "..." },
  "daily_trend": [ { "date": "2024-01-15", "total": 5, "churn": 2 } ],
  "contract_distribution": [ { "contract": "Month-to-month", "churn": 12, "total": 20 } ],
  "confidence_distribution": [ { "confidence": "High", "count": 28 } ]
}
```

---

## ML Pipeline

### Dataset

**Telco Customer Churn** (IBM Watson Analytics)
- 7,043 customers, 21 features
- Target: `Churn` (Yes/No) — ~26.5% churn rate
- Source: `backend/data/WA_Fn-UseC_-Telco-Customer-Churn.csv`

If the dataset is missing, `train.py` auto-generates a realistic synthetic dataset with matching distributions.

### Feature Engineering

| Step                  | Details                                                    |
|-----------------------|------------------------------------------------------------|
| Missing values        | `TotalCharges` blanks → 0 (new customers with 0 tenure)   |
| Label encoding        | Binary cols: gender, Partner, Dependents, PhoneService, PaperlessBilling |
| One-hot encoding      | Multi-category cols: Contract, InternetService, PaymentMethod, etc. |
| Feature scaling       | `StandardScaler` on tenure, MonthlyCharges, TotalCharges, SeniorCitizen |
| Train/test split      | 80/20 stratified                                           |

### Model Comparison

| Model               | Accuracy | Precision | Recall | F1    | ROC-AUC |
|---------------------|----------|-----------|--------|-------|---------|
| Logistic Regression | 73.8%    | 60.4%     | 78.0%  | 68.1% | 82.2%   |
| Decision Tree       | 64.9%    | 51.0%     | 51.0%  | 51.0% | 61.9%   |
| Random Forest       | 73.7%    | 64.8%     | 58.1%  | 61.3% | 79.6%   |
| SVM                 | 73.0%    | 59.5%     | 77.2%  | 67.2% | 80.9%   |
| **Tuned RF** ★      | **80.1%**| **67.3%** |**71.2%**|**69.2%**|**88.9%**|

The best model is selected by ROC-AUC and saved as `best_model.pkl`.

### Key Churn Predictors

1. **Tenure** — shorter tenure = higher churn risk
2. **Contract type** — Month-to-month customers churn 3× more
3. **Monthly charges** — higher bills correlate with churn
4. **Internet service** — Fiber optic users churn more
5. **Payment method** — Electronic check users churn more
6. **Tech support / Online security** — absence increases churn

---

## Environment Variables

| Variable                      | Default                          | Description                    |
|-------------------------------|----------------------------------|--------------------------------|
| `APP_NAME`                    | `ChurnPredictor API`             | API title                      |
| `SECRET_KEY`                  | *(required)*                     | JWT signing secret (32+ chars) |
| `ALGORITHM`                   | `HS256`                          | JWT algorithm                  |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days)                 | JWT token lifetime             |
| `MONGODB_URL`                 | `mongodb://localhost:27017`      | MongoDB connection string      |
| `DATABASE_NAME`               | `churn_predictor`                | MongoDB database name          |
| `ALLOWED_ORIGINS`             | `http://localhost:5173`          | CORS allowed origins           |
| `MODEL_PATH`                  | `ml/artifacts/best_model.pkl`    | Path to trained model          |
| `SCALER_PATH`                 | `ml/artifacts/scaler.pkl`        | Path to scaler                 |
| `ENCODER_PATH`                | `ml/artifacts/encoders.pkl`      | Path to label encoders         |
| `FEATURE_NAMES_PATH`          | `ml/artifacts/feature_names.pkl` | Path to feature names list     |

---

## Docker Deployment

### Start All Services

```bash
docker-compose up --build
```

This starts:
- **MongoDB** on port `27017`
- **Backend** (FastAPI) on port `8000`
- **Frontend** (Nginx) on port `3000`

### Individual Services

```bash
# Backend only
docker build -t churn-backend ./backend
docker run -p 8000:8000 --env-file backend/.env churn-backend

# Frontend only
docker build -t churn-frontend ./frontend
docker run -p 3000:80 churn-frontend
```

### docker-compose.yml Overview

```yaml
services:
  mongodb:   # mongo:7, port 27017, persistent volume
  backend:   # FastAPI, port 8000, depends on mongodb
  frontend:  # Nginx + React build, port 3000, depends on backend
```

---

## Cloud Deployment

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. **Build Command:** `pip install -r requirements.txt && python -m ml.train`
5. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables from `.env`

### Frontend → Vercel

1. Import repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`

### Database → MongoDB Atlas

1. Create a free cluster on [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist `0.0.0.0/0` (or your server IP)
4. Copy the connection string to `MONGODB_URL` env var

---

## Security

| Concern              | Implementation                                              |
|----------------------|-------------------------------------------------------------|
| Password storage     | bcrypt hashing via `passlib` (never stored in plaintext)   |
| Authentication       | JWT tokens (HS256), 7-day expiry                           |
| Route protection     | `get_current_user` FastAPI dependency on all private routes |
| CORS                 | Explicit origin whitelist via `ALLOWED_ORIGINS`            |
| Input validation     | Pydantic v2 models with strict type checking               |
| Data isolation       | All queries filtered by `user_id` (no cross-user access)   |
| Auto-logout          | Axios 401 interceptor clears token and redirects to login  |

---

## Future Improvements

- [ ] **Real-time predictions** via WebSocket for batch processing
- [ ] **Email notifications** when high-risk customers are detected
- [ ] **Model retraining** endpoint with new data upload
- [ ] **SHAP values** for per-prediction explainability
- [ ] **Role-based access** (admin vs. analyst)
- [ ] **Rate limiting** on prediction endpoint
- [ ] **CI/CD pipeline** with GitHub Actions
- [ ] **Monitoring** with Prometheus + Grafana
- [ ] **A/B testing** between model versions
- [ ] **Chatbot assistant** for natural language insights queries
- [ ] **Export to PDF** for prediction reports
- [ ] **Multi-tenant** support for enterprise use

---

## Quick Reference

```bash
# Full local setup (after cloning)
cd backend && pip install -r requirements.txt
python -m ml.train
cd .. && python -m uvicorn backend.app.main:app --port 8000 --reload &
cd frontend && npm install && npm run dev

# Docker (one command)
docker-compose up --build

# API health check
curl http://localhost:8000/health

# Swagger UI
open http://localhost:8000/docs
```

---

*Built with FastAPI, React 19, scikit-learn, MongoDB, and Tailwind CSS v4.*


python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir "E:\Codec\Customer Churn Prediction"