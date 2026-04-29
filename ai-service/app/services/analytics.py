"""
Analytics Service
Generates insights and metrics for admin dashboard
"""
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.db_models import (
    Etudiant, Reclamation, DocumentRequest
)
from app.models.schemas import (
    ModuleAnalytics, DocumentStatistics, DashboardMetrics, DashboardResponse
)
from app.utils.logger import logger
from datetime import datetime, timedelta
import statistics


class AnalyticsService:
    """
    Generates dashboard metrics and insights for administrators
    """

    def get_dashboard_metrics(
        self,
        db: Session,
        days_back: int = 30
    ) -> DashboardResponse:
        """
        Generate comprehensive dashboard metrics
        """
        try:
            logger.info(
                f"Generating dashboard metrics for last {days_back} days")

            cutoff_date = datetime.utcnow() - timedelta(days=days_back)

            # ═══════════════════════════════════════════════════════════════
            # Basic Statistics
            # ═══════════════════════════════════════════════════════════════

            total_students = db.query(func.count(Etudiant.id)).scalar() or 0

            total_reclamations = db.query(func.count(Reclamation.id)).filter(
                Reclamation.date_reclamation >= cutoff_date
            ).scalar() or 0

            # ═══════════════════════════════════════════════════════════════
            # Document Statistics
            # ═══════════════════════════════════════════════════════════════
            total_analyzed = db.query(func.count(DocumentRequest.id)).filter(
                DocumentRequest.created_at >= cutoff_date,
                DocumentRequest.ai_safety_score.isnot(None)
            ).scalar() or 0

            approved_docs = db.query(func.count(DocumentRequest.id)).filter(
                DocumentRequest.created_at >= cutoff_date,
                DocumentRequest.ai_approved.is_(True)
            ).scalar() or 0

            rejected_docs = total_analyzed - approved_docs
            review_required = db.query(func.count(DocumentRequest.id)).filter(
                DocumentRequest.created_at >= cutoff_date,
                DocumentRequest.ai_safety_score.isnot(None),
                DocumentRequest.ai_approved.is_(False)
            ).scalar() or 0

            rejection_rate = (
                rejected_docs / total_analyzed
                if total_analyzed > 0
                else 0.0
            )

            document_stats = DocumentStatistics(
                total_analyzed=total_analyzed,
                approved=approved_docs,
                rejected=rejected_docs,
                review_required=review_required,
                rejection_rate=rejection_rate,
            )

            # ═══════════════════════════════════════════════════════════════
            # Reclamation Resolution Time (Average)
            # ═══════════════════════════════════════════════════════════════
            avg_resolution_time = self._get_avg_resolution_time(
                db, cutoff_date)

            # ═══════════════════════════════════════════════════════════════
            # Most Problematic Modules (by reclamation count)
            # ═══════════════════════════════════════════════════════════════
            problematic_modules = self._get_problematic_modules(
                db, cutoff_date)

            # ═══════════════════════════════════════════════════════════════
            # Reclamation Trends (priority distribution)
            # ═══════════════════════════════════════════════════════════════
            reclamation_trends = self._get_reclamation_trends(db, cutoff_date)

            # ═══════════════════════════════════════════════════════════════
            # Build Response
            # ═══════════════════════════════════════════════════════════════
            metrics = DashboardMetrics(
                total_students=total_students,
                total_reclamations=total_reclamations,
                avg_reclamation_resolution_time=avg_resolution_time,
                document_rejection_rate=rejection_rate,
                most_problematic_modules=problematic_modules,
                document_stats=document_stats,
                reclamation_trends=reclamation_trends,
            )

            response = DashboardResponse(
                metrics=metrics,
                generated_at=datetime.utcnow(),
                period=f"Last {days_back} days",
            )

            logger.info("Dashboard metrics generated successfully")
            return response

        except Exception as e:
            logger.error(f"Failed to get dashboard metrics: {e}")
            raise

    def _get_avg_resolution_time(
        self,
        db: Session,
        cutoff_date: datetime
    ) -> int:
        """
        Calculate average resolution time for reclamations (in hours)
        """
        try:
            resolved_reclamations = db.query(Reclamation).filter(
                Reclamation.date_reclamation >= cutoff_date,
                Reclamation.status.in_(["closed", "resolved", "treated"]),
            ).all()

            if not resolved_reclamations:
                return 0

            # If no update timestamp, assume 48 hours (placeholder)
            avg_hours = 48

            return avg_hours

        except Exception as e:
            logger.error(f"Failed to calculate resolution time: {e}")
            return 0

    def _get_problematic_modules(
        self,
        db: Session,
        cutoff_date: datetime
    ) -> List[ModuleAnalytics]:
        """
        Get modules with highest reclamation counts
        """
        try:
            # Query requires junction table or analysis
            # For now, return empty (would need to link reclamations ->
            # modules)
            return []

        except Exception as e:
            logger.error(f"Failed to get problematic modules: {e}")
            return []

    def _get_reclamation_trends(
        self,
        db: Session,
        cutoff_date: datetime
    ) -> Dict[str, int]:
        """
        Get distribution of reclamations by priority
        """
        try:
            priorities = ["basse", "moyenne", "urgente"]
            trends = {}

            for priority in priorities:
                count = db.query(func.count(Reclamation.id)).filter(
                    Reclamation.date_reclamation >= cutoff_date,
                    Reclamation.priorite == priority,
                ).scalar() or 0

                trends[priority] = count

            return trends

        except Exception as e:
            logger.error(f"Failed to get reclamation trends: {e}")
            return {}

    # ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
    # Advanced Analytics
    # ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

    def get_student_performance_insights(
        self,
        db: Session
    ) -> Dict:
        """
        Generate insights on student academic performance
        """
        logger.info("Generating student performance insights")

        try:
            students_with_moyenne = db.query(Etudiant).filter(
                Etudiant.moyenne.isnot(None)
            ).all()

            if not students_with_moyenne:
                return {"message": "No student performance data available"}

            moyennes = [float(s.moyenne) for s in students_with_moyenne]

            return {
                "total_students_with_data": len(moyennes),
                "average_moyenne": statistics.mean(moyennes),
                "median_moyenne": statistics.median(moyennes),
                "std_dev_moyenne": statistics.stdev(moyennes) if len(moyennes) > 1 else 0,
                "min_moyenne": min(moyennes),
                "max_moyenne": max(moyennes),
            }

        except Exception as e:
            logger.error(f"Failed to generate performance insights: {e}")
            raise

    def get_document_moderation_stats(
        self,
        db: Session,
        days_back: int = 30
    ) -> Dict:
        """
        Get detailed document moderation statistics
        """
        logger.info("Generating document moderation statistics")

        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)

            # Fetch all document requests with safety scores
            analyzed_docs = db.query(DocumentRequest).filter(
                DocumentRequest.created_at >= cutoff_date,
                DocumentRequest.ai_safety_score.isnot(None)
            ).all()

            if not analyzed_docs:
                return {"message": "No analyzed documents in period"}

            safety_scores = [float(d.ai_safety_score) for d in analyzed_docs]

            # Categorize by score range
            safe_high = len([s for s in safety_scores if s >= 0.8])
            safe_mid = len([s for s in safety_scores if 0.5 <= s < 0.8])
            unsafe_low = len([s for s in safety_scores if s < 0.5])

            return {
                "total_analyzed": len(analyzed_docs),
                "average_safety_score": statistics.mean(safety_scores),
                "safe_documents": safe_high,
                "moderate_documents": safe_mid,
                "unsafe_documents": unsafe_low,
                "analysis_period_days": days_back,
            }

        except Exception as e:
            logger.error(f"Failed to generate moderation stats: {e}")
            raise


# Global service instance
_analytics_service: AnalyticsService = None


def get_analytics_service() -> AnalyticsService:
    """
    Lazy-load analytics service
    """
    global _analytics_service
    if _analytics_service is None:
        _analytics_service = AnalyticsService()
    return _analytics_service
