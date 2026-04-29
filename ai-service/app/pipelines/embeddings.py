"""
Embeddings Pipeline
Converts text to semantic vectors using sentence-transformers
Lazy-loaded — never imported at module level
Includes in-memory cache keyed by hash(text)
"""
import hashlib
import numpy as np
from typing import List
from app.core.config import settings
from app.utils.logger import logger


class EmbeddingsPipelineStub:
    """
    Deterministic stub for embeddings pipeline when model cannot be loaded.
    Returns valid schema-compliant responses with deterministic vectors.
    """

    def __init__(self, dimension: int = 384):
        self.dimension = dimension

    def encode(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.array([])
        embeddings = []
        for text in texts:
            embeddings.append(self._deterministic_vector(text))
        return np.array(embeddings)

    def encode_single(self, text: str) -> np.ndarray:
        if not text or len(text.strip()) < 3:
            return np.zeros(self.dimension)
        return self._deterministic_vector(text)

    def similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        try:
            sim = np.dot(embedding1, embedding2)
            return float((sim + 1) / 2)
        except Exception as e:
            logger.warning(f"Similarity calculation error: {e}")
            return 0.5

    def _deterministic_vector(self, text: str) -> np.ndarray:
        """Generate a deterministic L2-normalized vector from text hash."""
        h = hashlib.md5(text.encode()).hexdigest()
        seed = int(h[:8], 16)
        rng = np.random.RandomState(seed)
        vec = rng.randn(self.dimension).astype(np.float32)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec


class EmbeddingsPipeline:
    """
    Convert text to semantic embeddings with in-memory cache
    """

    def __init__(self):
        """Initialize embeddings model (lazy — only called on first use)"""
        self._cache = {}  # hash(text) -> np.ndarray

        try:
            from sentence_transformers import SentenceTransformer

            device = "cpu"
            try:
                import torch
                device = "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                pass

            logger.info(f"Loading embeddings model on device: {device}")

            self.model = SentenceTransformer(
                settings.embeddings_model,
                device=device
            )

            # Verify dimensions
            test_embedding = self.model.encode("test")
            actual_dim = len(test_embedding)
            if actual_dim != settings.embeddings_dimension:
                logger.warning(
                    f"Expected embedding dimension {settings.embeddings_dimension}, "
                    f"got {actual_dim}"
                )

            self._stub = False
            logger.info("✅ Embeddings model loaded successfully")

        except Exception as e:
            logger.warning(
                f"⚠️ Failed to load embeddings model, using deterministic stub: {e}"
            )
            self._stub = True
            self._fallback = EmbeddingsPipelineStub(
                settings.embeddings_dimension)

    def _cache_key(self, text: str) -> str:
        """Generate cache key from text hash."""
        return hashlib.md5(text.encode()).hexdigest()

    def encode(self, texts: List[str]) -> np.ndarray:
        """
        Encode multiple texts to embeddings
        Returns: (n_samples, embedding_dim) numpy array
        """
        if not texts:
            return np.array([])

        if self._stub:
            return self._fallback.encode(texts)

        try:
            embeddings = self.model.encode(
                texts,
                convert_to_numpy=True,
                show_progress_bar=False,
                normalize_embeddings=True,
            )

            # Cache each result
            for i, text in enumerate(texts):
                key = self._cache_key(text)
                self._cache[key] = embeddings[i]

            logger.debug(f"Encoded {len(texts)} texts to embeddings")
            return embeddings

        except Exception as e:
            logger.error(f"Embedding encoding failed: {e}")
            return np.array([])

    def encode_single(self, text: str) -> np.ndarray:
        """
        Encode single text to embedding with cache lookup
        """
        if not text or len(text.strip()) < 3:
            return np.zeros(settings.embeddings_dimension)

        # Check cache first
        key = self._cache_key(text)
        if key in self._cache:
            logger.debug("Embeddings cache hit")
            return self._cache[key]

        if self._stub:
            result = self._fallback.encode_single(text)
            self._cache[key] = result
            return result

        try:
            embedding = self.model.encode(
                text,
                convert_to_numpy=True,
                normalize_embeddings=True,
            )

            # L2-normalize
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm

            self._cache[key] = embedding
            return embedding

        except Exception as e:
            logger.error(f"Single embedding encoding failed: {e}")
            return np.zeros(settings.embeddings_dimension)

    def similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two embeddings
        Returns: similarity score in range [0, 1]
        """
        try:
            # Cosine similarity via dot product (embeddings already normalized)
            similarity = np.dot(embedding1, embedding2)
            # Normalize to [0, 1] range
            similarity = (similarity + 1) / 2
            return float(similarity)
        except Exception as e:
            logger.error(f"Similarity calculation failed: {e}")
            return 0.5


# Global embeddings pipeline instance — lazy-loaded
_embeddings_pipeline: EmbeddingsPipeline = None


def get_embeddings_pipeline() -> EmbeddingsPipeline:
    """
    Lazy-load embeddings pipeline
    """
    global _embeddings_pipeline
    if _embeddings_pipeline is None:
        _embeddings_pipeline = EmbeddingsPipeline()
    return _embeddings_pipeline
