"""
Reclamation Analysis Service
Detects patterns, clusters complaints, and identifies priority
"""
from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.db_models import Reclamation
from app.models.schemas import ReclamationCluster, ReclamationInsights, ReclamationAnalysisResponse
from app.pipelines.embeddings import get_embeddings_pipeline
from app.pipelines.clustering import get_clustering_pipeline
from app.utils.logger import logger
from datetime import datetime, timedelta
import numpy as np


class ReclamationAnalysisService:
    """
    Analyzes reclamations for patterns, clustering, and priority detection
    """

    def __init__(self):
        self.embeddings_pipeline = get_embeddings_pipeline()
        self.clustering_pipeline = get_clustering_pipeline()

    def analyze_reclamations(
        self,
        db: Session,
        days_back: int = 30
    ) -> ReclamationAnalysisResponse:
        """
        Comprehensive reclamation analysis
        """
        try:
            logger.info(f"Analyzing reclamations from last {days_back} days")

            # ═══════════════════════════════════════════════════════════════
            # Fetch Reclamations
            # ═══════════════════════════════════════════════════════════════
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)

            reclamations = db.query(Reclamation).filter(
                Reclamation.date_reclamation >= cutoff_date
            ).all()

            total_reclamations = len(reclamations)
            logger.info(f"Found {total_reclamations} reclamations in period")

            if total_reclamations == 0:
                return ReclamationAnalysisResponse(
                    insights=ReclamationInsights(
                        total_reclamations=0,
                        clustered_count=0,
                        unique_topics=0,
                        top_clusters=[],
                        trending_topics=[],
                        priority_distribution={},
                    ),
                    timestamp=datetime.utcnow(),
                    analysis_period=f"Last {days_back} days",
                )

            # ═══════════════════════════════════════════════════════════════
            # Generate Embeddings
            # ═══════════════════════════════════════════════════════════════
            descriptions = [
                r.description or r.objet or "" for r in reclamations]
            embeddings = self.embeddings_pipeline.encode(descriptions)

            if embeddings.size == 0:
                logger.error("Failed to generate embeddings")
                return ReclamationAnalysisResponse(
                    insights=ReclamationInsights(
                        total_reclamations=total_reclamations,
                        clustered_count=0,
                        unique_topics=0,
                        top_clusters=[],
                        trending_topics=[],
                        priority_distribution={},
                    ),
                    timestamp=datetime.utcnow(),
                    analysis_period=f"Last {days_back} days",
                )

            # ═══════════════════════════════════════════════════════════════
            # Perform Clustering
            # ═══════════════════════════════════════════════════════════════
            clustering_result = self.clustering_pipeline.cluster(embeddings)
            labels = clustering_result["labels"]

            # ═══════════════════════════════════════════════════════════════
            # Analyze Clusters
            # ═══════════════════════════════════════════════════════════════
            clusters_data = self._analyze_clusters(
                reclamations,
                labels,
                descriptions
            )

            # ═══════════════════════════════════════════════════════════════
            # Determine Priorities and Update DB
            # ═══════════════════════════════════════════════════════════════
            self._update_reclamation_priorities(
                db, reclamations, labels, clusters_data)

            # ═══════════════════════════════════════════════════════════════
            # Build Response
            # ═══════════════════════════════════════════════════════════════
            insights = ReclamationInsights(
                total_reclamations=total_reclamations,
                clustered_count=len(
                    [label_val for label_val in labels if label_val != -1]),
                unique_topics=clustering_result["n_clusters"],
                top_clusters=clusters_data["top_clusters"][:5],
                trending_topics=clusters_data["trending_topics"],
                priority_distribution=clusters_data["priority_distribution"],
            )

            response = ReclamationAnalysisResponse(
                insights=insights,
                timestamp=datetime.utcnow(),
                analysis_period=f"Last {days_back} days",
            )

            logger.info(
                f"Reclamation analysis complete: "
                f"{insights.unique_topics} topics, "
                f"{insights.clustered_count} clustered, "
                f"priorities updated"
            )

            return response

        except Exception as e:
            logger.error(f"Reclamation analysis failed: {e}")
            raise

    def _analyze_clusters(
        self,
        reclamations: List[Reclamation],
        labels: np.ndarray,
        descriptions: List[str]
    ) -> Dict:
        """
        Analyze individual clusters to extract insights
        """
        clusters_info = {}
        priority_distribution = {"basse": 0, "moyenne": 0, "urgente": 0}

        for cluster_id in set(labels):
            if cluster_id == -1:  # Noise points
                continue

            cluster_indices = np.where(labels == cluster_id)[0]
            cluster_reclamations = [reclamations[i] for i in cluster_indices]
            cluster_count = len(cluster_reclamations)

            # Determine priority based on frequency
            if cluster_count >= 10:
                priority = "urgente"
            elif cluster_count >= 5:
                priority = "moyenne"
            else:
                priority = "basse"

            priority_distribution[priority] += cluster_count

            # Extract cluster topic from most common keywords
            cluster_descriptions = [descriptions[i] for i in cluster_indices]
            topic = self._extract_cluster_topic(cluster_descriptions)

            # Collect sample reclamations
            samples = [r.objet or r.description[:50]
                       for r in cluster_reclamations[:3]]

            clusters_info[cluster_id] = {
                "topic": topic,
                "count": cluster_count,
                "priority": priority,
                "samples": samples,
            }

        # ═══════════════════════════════════════════════════════════════
        # Build Response Structure
        # ═══════════════════════════════════════════════════════════════
        top_clusters = [
            ReclamationCluster(
                cluster_id=cid,
                topic=info["topic"],
                count=info["count"],
                priority=info["priority"],
                sample_reclamations=info["samples"],
            )
            for cid, info in sorted(
                clusters_info.items(),
                key=lambda x: x[1]["count"],
                reverse=True
            )
        ]

        trending_topics = [c.topic for c in top_clusters[:5]]

        return {
            "clusters": clusters_info,
            "top_clusters": top_clusters,
            "trending_topics": trending_topics,
            "priority_distribution": priority_distribution,
        }

    def _extract_cluster_topic(self, descriptions: List[str]) -> str:
        """
        Extract topic from cluster descriptions
        Simple heuristic: most common first words
        """
        if not descriptions:
            return "Unknown"

        first_words = []
        for desc in descriptions:
            words = desc.split()[:3]
            first_words.extend(words)

        # Count frequency
        word_counts = {}
        for word in first_words:
            if len(word) > 3:  # Skip short words
                word_counts[word] = word_counts.get(word, 0) + 1

        if word_counts:
            top_word = max(word_counts, key=word_counts.get)
            return f"{top_word} issues"

        return "General complaints"

    def _update_reclamation_priorities(
        self,
        db: Session,
        reclamations: List[Reclamation],
        labels: np.ndarray,
        clusters_data: Dict
    ):
        """
        Update reclamation priorities in database based on clustering
        """
        try:
            for i, reclamation in enumerate(reclamations):
                cluster_id = labels[i]

                if cluster_id == -1:
                    priority = "basse"
                else:
                    priority = clusters_data["clusters"].get(
                        cluster_id, {}
                    ).get("priority", "moyenne")

                reclamation.priorite = priority

            db.commit()
            logger.debug(
                f"Updated priorities for {len(reclamations)} reclamations")

        except Exception as e:
            logger.error(f"Failed to update reclamation priorities: {e}")
            db.rollback()


# Global service instance
_reclamation_service: ReclamationAnalysisService = None


def get_reclamation_service() -> ReclamationAnalysisService:
    """
    Lazy-load reclamation service
    """
    global _reclamation_service
    if _reclamation_service is None:
        _reclamation_service = ReclamationAnalysisService()
    return _reclamation_service
