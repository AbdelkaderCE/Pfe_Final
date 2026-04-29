"""
Health Check & Status Endpoint
"""
from fastapi import APIRouter
from app.models.schemas import HealthCheckResponse
from app.core.config import settings
from datetime import datetime

router = APIRouter(tags=["health"])


def _nlp_loaded() -> bool:
    try:
        from app.pipelines.nlp import get_nlp_pipeline
        return get_nlp_pipeline() is not None
    except:
        return False

def _cv_loaded() -> bool:
    try:
        from app.pipelines.cv import get_cv_pipeline
        return get_cv_pipeline() is not None
    except:
        return False

def _emb_loaded() -> bool:
    try:
        from app.pipelines.embeddings import get_embeddings_pipeline
        return get_embeddings_pipeline() is not None
    except:
        return False

@router.get("/health")
async def health_check():
    from app.utils.cache import moderation_cache
    from app.core.database import engine
    from sqlalchemy import text
    
    # Check DB
    db_status = "unavailable"
    db_tables = 0
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_status = "connected"
            from sqlalchemy import inspect
            db_tables = len(inspect(engine).get_table_names())
    except Exception:
        db_status = "unavailable"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": {
            "status": db_status,
            "tables": db_tables
        },
        "cache": moderation_cache.stats(),
        "models": {
            "nlp": "loaded" if _nlp_loaded() else "stub",
            "cv": "loaded" if _cv_loaded() else "stub",
            "embeddings": "loaded" if _emb_loaded() else "stub"
        },
        "endpoints_active": 7,
        "rate_limit": "100 req/min per IP"
    }
