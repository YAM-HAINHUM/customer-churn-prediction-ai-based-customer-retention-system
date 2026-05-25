"""
Authentication routes: register, login, and get current user.
JWT-protected endpoints use the get_current_user dependency.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from ..models.schemas import (
    UserRegisterRequest, UserLoginRequest,
    TokenResponse, UserResponse, MessageResponse
)
from ..services.auth_service import (
    register_user, authenticate_user, create_access_token,
    decode_access_token, get_user_by_id, format_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()
logger = logging.getLogger(__name__)


# ─── Dependency: Authenticated User ──────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Extract and validate JWT token from Authorization header.
    Returns the authenticated user document.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegisterRequest):
    """Register a new user and return a JWT token."""
    try:
        user = await register_user(body.name, body.email, body.password)
        token = create_access_token({"sub": str(user["_id"])})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": format_user(user),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLoginRequest):
    """Authenticate user credentials and return a JWT token."""
    user = await authenticate_user(body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    token = create_access_token({"sub": str(user["_id"])})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": format_user(user),
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return format_user(current_user)
