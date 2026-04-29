"""
Analytics Dashboard Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.security.rbac import RBACManager
from app.models.schemas import UserInfo, DashboardResponse, ErrorResponse
from app.services.analytics import get_analytics_service
from app.utils.logger import logger
import traceback

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    responses={
        403: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
async def get_dashboard(
    days_back: int = Query(
        30, ge=1, le=365, description="Days back to analyze"),
    user: UserInfo = Depends(
        RBACManager.require_permission("analytics:dashboard")),
    db: Session = Depends(get_db),
):
    """
    Get comprehensive analytics dashboard for administrators

    **Required Role:** admin

    **Query Parameters:**
    - days_back: Number of days to analyze (1-365, default 30)

    **Response:**
    - metrics: Dashboard metrics including:
      - total_students
      - total_reclamations
      - document_rejection_rate
      - most_problematic_modules
      - reclamation_trends
    - generated_at: Timestamp of generation
    - period: Analysis period
    """
    try:
        logger.info(
            f"Dashboard request from admin {user.id} for last {days_back} days"
        )

        analytics_service = get_analytics_service()
        response = analytics_service.get_dashboard_metrics(
            db=db,
            days_back=days_back
        )

        logger.info("Dashboard metrics generated successfully")

        return response

    except Exception as e:
        logger.error(
            f"Dashboard endpoint failed: {e}\n{traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate dashboard metrics: {type(e).__name__}",
        )


@router.get(
    "/student-performance",
    response_model=dict,
    responses={
        403: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
async def get_student_performance(
    user: UserInfo = Depends(
        RBACManager.require_permission("analytics:dashboard")),
    db: Session = Depends(get_db),
):
    """
    Get student academic performance statistics

    **Required Role:** admin
    """
    try:
        logger.info(
            f"Student performance analytics request from admin {user.id}")

        analytics_service = get_analytics_service()
        stats = analytics_service.get_student_performance_insights(db)

        return stats

    except Exception as e:
        logger.error(
            f"Student performance endpoint failed: {e}\n{traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve student performance data: {type(e).__name__}",
        )


@router.get(
    "/moderation-stats",
    response_model=dict,
    responses={
        403: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
async def get_moderation_stats(
    days_back: int = Query(
        30, ge=1, le=365, description="Days back to analyze"),
    user: UserInfo = Depends(
        RBACManager.require_permission("analytics:dashboard")),
    db: Session = Depends(get_db),
):
    """
    Get document moderation statistics

    **Required Role:** admin

    **Query Parameters:**
    - days_back: Number of days to analyze (1-365, default 30)
    """
    try:
        logger.info(
            f"Moderation statistics request from admin {user.id} "
            f"for last {days_back} days"
        )

        analytics_service = get_analytics_service()
        stats = analytics_service.get_document_moderation_stats(
            db=db,
            days_back=days_back
        )

        return stats

    except Exception as e:
        logger.error(
            f"Moderation stats endpoint failed: {e}\n{traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve moderation statistics: {type(e).__name__}",
        )
