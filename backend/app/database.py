"""
Async MongoDB connection using Motor driver.
Provides a singleton database client and collection helpers.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import settings
import logging

logger = logging.getLogger(__name__)

# Singleton motor client
_client: AsyncIOMotorClient = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URL)
    return _client


def get_database() -> AsyncIOMotorDatabase:
    return get_client()[settings.DATABASE_NAME]


async def connect_db():
    """Initialize database connection and create indexes."""
    try:
        client = get_client()
        await client.admin.command("ping")
        db = get_database()

        await db.users.create_index("email", unique=True)
        await db.users.create_index("created_at")
        await db.predictions.create_index("user_id")
        await db.predictions.create_index("created_at")
        await db.predictions.create_index([("user_id", 1), ("created_at", -1)])

        logger.info("[OK] MongoDB connected successfully.")
    except Exception as e:
        logger.error(f"[ERR] MongoDB connection failed: {e}")
        raise


async def close_db():
    """Close database connection."""
    global _client
    if _client:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed.")
