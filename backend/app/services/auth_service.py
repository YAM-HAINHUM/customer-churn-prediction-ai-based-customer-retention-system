"""
Authentication service: password hashing, JWT creation/verification,
user creation, and lookup.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from bson import ObjectId
import logging

from ..config import settings
from ..database import get_database

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    password_bytes = password.encode('utf-8')
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext against bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


async def register_user(name: str, email: str, password: str) -> dict:
    """
    Register a new user in the database.
    Returns the created user document.
    """
    db = get_database()

    # Check if email already exists
    existing = await db.users.find_one({"email": email.lower()})
    if existing:
        raise ValueError("Email already registered")

    user_doc = {
        "name": name.strip(),
        "email": email.lower().strip(),
        "hashed_password": hash_password(password),
        "created_at": datetime.now(timezone.utc),
        "is_active": True,
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    return user_doc


async def authenticate_user(email: str, password: str) -> Optional[dict]:
    """
    Authenticate user credentials.
    Returns user document if valid, None otherwise.
    """
    db = get_database()
    user = await db.users.find_one({"email": email.lower()})
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


async def get_user_by_id(user_id: str) -> Optional[dict]:
    """Fetch a user document by their ObjectId string."""
    try:
        db = get_database()
        return await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


def format_user(user_doc: dict) -> dict:
    """Convert MongoDB user document to API-safe format."""
    return {
        "id": str(user_doc["_id"]),
        "name": user_doc["name"],
        "email": user_doc["email"],
        "created_at": user_doc["created_at"],
    }
