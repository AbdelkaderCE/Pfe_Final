"""
Main FastAPI Application
AI Microservice for University Management System
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime
import asyncio
from app.core.config import settings
from app.core.database import connect_db, disconnect_db, engine, Base
from app.security.audit import AuditLoggingMiddleware
from app.security.rate_limit import rate_limit_middleware
from app.utils.logger import logger
from app.api.v1.endpoints import health, documents, reclamations, analytics, images
from app.models.db_models import *  # noqa: Import all models


# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
# Model Pre-Warming (background task)
# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

async def _prewarm_models():
    """
    Pre-warm all AI models in a background task so the first user request
    does not incur a 10+ second latency spike.
    Runs in background — does NOT block server startup.
    """
    try:
        logger.info("🔥 Pre-warming AI models in background...")

        loop = asyncio.get_event_loop()

        # Pre-warm NLP pipeline
        try:
            from app.pipelines.nlp import get_nlp_pipeline
            await loop.run_in_executor(None, get_nlp_pipeline)
            logger.info("  ✅ NLP pipeline pre-warmed")
        except Exception as e:
            logger.warning(f"  ⚠️ NLP pre-warm failed (non-fatal): {e}")

        # Pre-warm moderation pipeline
        try:
            from app.pipelines.moderation import get_hybrid_moderator
            await loop.run_in_executor(None, get_hybrid_moderator)
            logger.info("  ✅ Moderation pipeline pre-warmed")
        except Exception as e:
            logger.warning(f"  ⚠️ Moderation pre-warm failed (non-fatal): {e}")

        # Pre-warm unified vision pipeline (includes NSFW model + EasyOCR)
        try:
            from app.pipelines.vision import get_vision_pipeline
            pipeline = await loop.run_in_executor(None, get_vision_pipeline)
            await loop.run_in_executor(None, pipeline.pre_warm)
            logger.info("  ✅ Vision pipeline pre-warmed")
        except Exception as e:
            logger.warning(f"  ⚠️ Vision pre-warm failed (non-fatal): {e}")

        # Pre-warm embeddings pipeline
        try:
            from app.pipelines.embeddings import get_embeddings_pipeline
            await loop.run_in_executor(None, get_embeddings_pipeline)
            logger.info("  ✅ Embeddings pipeline pre-warmed")
        except Exception as e:
            logger.warning(f"  ⚠️ Embeddings pre-warm failed (non-fatal): {e}")

        logger.info("🔥 AI model pre-warming complete")

    except Exception as e:
        logger.error(f"❌ Model pre-warming failed (non-fatal): {e}")


# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
# Lifecycle Events
# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management
    """
    # ─────────────────────────────────────────────────────────────────
    # Startup
    # ─────────────────────────────────────────────────────────────────
    logger.info(f"🚀 Starting {settings.app_name} v{settings.app_version}")

    try:
        # Connect to database
        await connect_db()

        # Create tables if not exist
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables verified")

        # Launch model pre-warming as background task (non-blocking)
        asyncio.create_task(_prewarm_models())
        logger.info("✅ AI model pre-warming scheduled (background)")

    except Exception as e:
        logger.error(f"❌ Failed to initialize application: {e}")
        raise

    yield

    # ─────────────────────────────────────────────────────────────────
    # Shutdown
    # ─────────────────────────────────────────────────────────────────
    logger.info("🛑 Shutting down application")

    try:
        await disconnect_db()
        logger.info("✅ Database connection closed")
    except Exception as e:
        logger.error(f"⚠️ Error during shutdown: {e}")


# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
# Create FastAPI App
# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title=settings.app_name,
    description="Production-grade AI Microservice for University Management System",
    version=settings.app_version,
    lifespan=lifespan,
)

# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
# CORS Configuration
# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Frontend dev
        "http://localhost:3001",      # Alternative frontend
        "https://yourdomain.com",     # Production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
# Rate Limiting Middleware
# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

app.middleware("http")(rate_limit_middleware)
logger.info("✅ Rate limiting enabled")

# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
# Audit Logging Middleware
# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

if settings.audit_enabled:
    app.add_middleware(AuditLoggingMiddleware)
    logger.info("✅ Audit logging enabled")

# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
# Include Routers
# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

app.include_router(health.router)
app.include_router(documents.router)
app.include_router(reclamations.router)
app.include_router(analytics.router)
app.include_router(images.router)

logger.info("✅ All API routes registered")

# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
# Exception Handlers
# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler — returns proper JSON body"""
    logger.warning(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler — returns 500 JSON body"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
# Root Endpoint
# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    """API documentation root"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "documentation": "/docs",
        "openapi_schema": "/openapi.json",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
    )
