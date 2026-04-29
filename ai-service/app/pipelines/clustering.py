"""
Clustering Pipeline
Groups similar reclamations using KMeans with DBSCAN fallback
"""
import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from typing import Tuple, Dict, Any
from app.core.config import settings
from app.utils.logger import logger


class ClusteringPipeline:
    """
    Cluster reclamation embeddings using unsupervised learning
    Falls back to DBSCAN when n_samples < n_clusters
    """

    def __init__(self):
        """Initialize clustering parameters"""
        self.algorithm = settings.clustering_algorithm
        self.n_clusters = settings.clustering_n_clusters
        self.min_samples = settings.clustering_min_samples
        logger.info(
            f"Clustering initialized: algorithm={self.algorithm}, n_clusters={self.n_clusters}")

    def kmeans_clustering(
        self,
        embeddings: np.ndarray,
        n_clusters: int = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Perform KMeans clustering
        Returns: (cluster_centers, labels)
        """
        if embeddings.size == 0:
            return np.array([]), np.array([])

        n_clusters = n_clusters or min(self.n_clusters, len(embeddings))

        try:
            kmeans = KMeans(
                n_clusters=n_clusters,
                random_state=42,
                n_init=10,
                max_iter=300
            )

            labels = kmeans.fit_predict(embeddings)
            logger.debug(
                f"KMeans clustering: {n_clusters} clusters, inertia={kmeans.inertia_:.2f}")

            return kmeans.cluster_centers_, labels

        except Exception as e:
            logger.error(f"KMeans clustering failed: {e}")
            return np.array([]), np.array([])

    def dbscan_clustering(
        self,
        embeddings: np.ndarray,
        eps: float = 0.3
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Perform DBSCAN clustering (density-based)
        Returns: (cluster_centers, labels)
        """
        if embeddings.size == 0:
            return np.array([]), np.array([])

        try:
            dbscan = DBSCAN(
                eps=eps,
                min_samples=self.min_samples,
                metric="cosine"
            )

            labels = dbscan.fit_predict(embeddings)
            n_clusters = len(set(labels)) - (1 if -1 in labels else 0)

            logger.debug(f"DBSCAN clustering: {n_clusters} clusters found")

            return np.array([]), labels

        except Exception as e:
            logger.error(f"DBSCAN clustering failed: {e}")
            return np.array([]), np.array([])

    def cluster(
        self,
        embeddings: np.ndarray
    ) -> Dict[str, Any]:
        """
        Perform clustering with configured algorithm.
        Automatically falls back to DBSCAN when n_samples < n_clusters.
        """
        n_samples = len(embeddings) if embeddings.size > 0 else 0

        # ─── Fallback: too few samples for KMeans ─────────────────────
        if n_samples < self.n_clusters and n_samples > 0:
            logger.info(
                f"n_samples ({n_samples}) < n_clusters ({self.n_clusters}), "
                f"falling back to DBSCAN"
            )
            cluster_centers, labels = self.dbscan_clustering(embeddings)
        elif self.algorithm == "kmeans":
            cluster_centers, labels = self.kmeans_clustering(embeddings)
        elif self.algorithm == "dbscan":
            cluster_centers, labels = self.dbscan_clustering(embeddings)
        else:
            logger.warning(
                f"Unknown clustering algorithm: {self.algorithm}, using KMeans")
            cluster_centers, labels = self.kmeans_clustering(embeddings)

        if isinstance(labels, np.ndarray) and labels.size > 0:
            n_found = len(set(labels)) - (1 if -1 in labels else 0)
        else:
            n_found = 0

        return {
            "labels": labels,
            "centers": cluster_centers,
            "n_clusters": n_found,
        }

    @staticmethod
    def assign_priority(cluster_count: int) -> str:
        """
        Assign priority based on cluster count:
        - urgente: count >= 10
        - moyenne: count >= 5
        - basse: count < 5
        """
        if cluster_count >= 10:
            return "urgente"
        elif cluster_count >= 5:
            return "moyenne"
        else:
            return "basse"


# Global clustering pipeline instance — lazy-loaded
_clustering_pipeline: ClusteringPipeline = None


def get_clustering_pipeline() -> ClusteringPipeline:
    """
    Lazy-load clustering pipeline
    """
    global _clustering_pipeline
    if _clustering_pipeline is None:
        _clustering_pipeline = ClusteringPipeline()
    return _clustering_pipeline
