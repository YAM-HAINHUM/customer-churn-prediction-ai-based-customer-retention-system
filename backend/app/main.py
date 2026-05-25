"""
Customer Churn Prediction API
FastAPI application entry point with lifespan management.
"""
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import connect_db, close_db
from .services import ml_service
from .routes import auth, predict, history, upload, admin, analytics, chat

# ─── Logging Setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


# ─── Lifespan (startup / shutdown) ───────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect DB, load ML model. Shutdown: close DB."""
    logger.info("Starting Customer Churn Prediction API...")
    await connect_db()
    ml_service.load_artifacts()
    yield
    logger.info("Shutting down...")
    await close_db()


# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production-ready REST API for predicting customer churn using "
        "machine learning. Supports JWT authentication, MongoDB persistence, "
        "and real-time prediction with explainability."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router,    prefix="/api")
app.include_router(predict.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(upload.router,    prefix="/api")
app.include_router(admin.router,     prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(chat.router,      prefix="/api")


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "model_ready": ml_service.is_ready(),
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "model_ready": ml_service.is_ready()}
