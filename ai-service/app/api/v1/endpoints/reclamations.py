"""
Reclamation Analysis Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.security.rbac import RBACManager
from app.models.schemas import (
    UserInfo, ReclamationAnalysisResponse, ErrorResponse
)
from app.services.reclamation_analysis import get_reclamation_service
from app.utils.logger import logger
import traceback

router = APIRouter(prefix="/api/v1/reclamations",
                   tags=["Reclamation Analysis"])


@router.post(
    "",
    response_model=dict,
    responses={
        403: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
async def analyze_single_reclamation(
    payload: dict,
    user: UserInfo = Depends(RBACManager.require_permission("reclamations:insights")),
    db: Session = Depends(get_db),
):
    """
    Analyze a single reclamation for sentiment, toxicity, and priority.
    """
    try:
        text = payload.get("text_content", "")
        if not text:
            raise HTTPException(status_code=422, detail="Text content is required")

        reclamation_service = get_reclamation_service()
        # Using the internal analysis logic
        from app.pipelines.nlp import get_nlp_pipeline
        from app.pipelines.moderation import get_hybrid_moderator
        
        nlp = get_nlp_pipeline()
        moderator = get_hybrid_moderator()
        
        # 1. Check safety
        safety = moderator.moderate_document(text)
        
        # 2. Check sentiment/categories
        nlp_result = nlp.classify_text(text)
        
        return {
            "reclamation_id": payload.get("reclamation_id"),
            "is_safe": not safety.get("is_toxic", False),
            "toxicity_level": safety.get("toxicity_level", "low"),
            "sentiment": nlp_result.get("sentiment", "neutral"),
            "categories": nlp_result.get("categories", ["general"]),
            "summary": nlp_result.get("summary", "No summary available."),
            "priority_suggestion": "high" if safety.get("toxicity_level") != "low" or nlp_result.get("sentiment") == "negative" else "normal"
        }

    except Exception as e:
        logger.error(f"Single reclamation analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}",
        )


@router.get(
    "/clusters",
    response_model=ReclamationAnalysisResponse,
    responses={
        403: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
async def get_reclamation_clusters(
    days_back: int = Query(
        30, ge=1, le=365, description="Days back to analyze"),
    user: UserInfo = Depends(
        RBACManager.require_permission("reclamations:insights")),
    db: Session = Depends(get_db),
):
    """
    Analyze reclamations and detect clusters/patterns

    **Required Role:** admin

    **Query Parameters:**
    - days_back: Number of days to analyze (1-365, default 30)

    **Response:**
    - insights: Clustering analysis with topics and priorities
    - timestamp: Analysis timestamp
    - analysis_period: Period covered by analysis
    """
    try:
        logger.info(
            f"Reclamation clustering request from user {user.id} "
            f"for last {days_back} days"
        )

        reclamation_service = get_reclamation_service()
        analysis = reclamation_service.analyze_reclamations(
            db=db,
            days_back=days_back
        )

        logger.info(
            f"Reclamation analysis: "
            f"{analysis.insights.unique_topics} topics identified"
        )

        return analysis

    except Exception as e:
        logger.error(
            f"Reclamation clusters endpoint failed: {e}\n{traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze reclamation clusters: {type(e).__name__}",
        )


@router.get(
    "/insights",
    response_model=dict,
    responses={
        403: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
async def get_reclamation_insights(
    days_back: int = Query(
        30, ge=1, le=365, description="Days back to analyze"),
    user: UserInfo = Depends(
        RBACManager.require_permission("reclamations:insights")),
    db: Session = Depends(get_db),
):
    """
    Get high-level insights about reclamations

    **Required Role:** admin

    **Returns:**
    - total_reclamations: Total count
    - trending_topics: Top complaint categories
    - priority_distribution: Count by priority level
    """
    try:
        logger.info(f"Reclamation insights request from user {user.id}")

        reclamation_service = get_reclamation_service()
        analysis = reclamation_service.analyze_reclamations(
            db=db,
            days_back=days_back
        )

        return {
            "total_reclamations": analysis.insights.total_reclamations,
            "unique_topics": analysis.insights.unique_topics,
            "trending_topics": analysis.insights.trending_topics,
            "priority_distribution": analysis.insights.priority_distribution,
            "analysis_period": analysis.analysis_period,
        }

    except Exception as e:
        logger.error(
            f"Reclamation insights endpoint failed: {e}\n{traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reclamation insights: {type(e).__name__}",
        )
