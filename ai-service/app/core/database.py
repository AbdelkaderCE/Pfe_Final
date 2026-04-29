"""
Database connection and session management
PostgreSQL with SQLAlchemy ORM
"""
from sqlalchemy import create_engine, pool
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════
# Database Engine
# ═══════════════════════════════════════════════════════════════
_engine_kwargs = {
    "echo": settings.db_echo,
    "pool_pre_ping": True,
}

# NullPool does not support pool_size / max_overflow
if settings.debug:
    _engine_kwargs["poolclass"] = pool.NullPool
else:
    _engine_kwargs["poolclass"] = pool.QueuePool
    _engine_kwargs["pool_size"] = settings.db_pool_size
    _engine_kwargs["max_overflow"] = settings.db_max_overflow

# SQLite needs check_same_thread=False
if settings.database_url.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, **_engine_kwargs)

# ═══════════════════════════════════════════════════════════════
# Session Factory
# ═══════════════════════════════════════════════════════════════
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ═══════════════════════════════════════════════════════════════
# Base Model
# ═══════════════════════════════════════════════════════════════
Base = declarative_base()


# ═══════════════════════════════════════════════════════════════
# Dependency Injection - Get DB Session
# ═══════════════════════════════════════════════════════════════
def get_db() -> Session:
    """
    FastAPI dependency to get database session
    Usage:
        async def endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════
# Connection Lifecycle
# ═══════════════════════════════════════════════════════════════
async def connect_db():
    """Initialize database connection"""
    try:
        # Test connection
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1 as connected")
            logger.info("✅ PostgreSQL connection verified")
    except Exception as e:
        logger.warning(f"⚠️ Database connection test failed: {e}")
        logger.info("Continuing with lazy database connections...")


async def disconnect_db():
    """Close database connection"""
    engine.dispose()
    logger.info("🛑 Database connection closed")
