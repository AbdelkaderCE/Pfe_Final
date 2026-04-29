"""
NLP Pipeline for toxicity/offensive content detection
Uses transformers for multi-lingual classification
Lazy-loaded — never imported at module level
"""
from typing import Tuple
from app.core.config import settings
from app.utils.logger import logger


class NLPPipelineStub:
    """
    Deterministic stub used when ML models cannot be downloaded (offline env).
    Returns valid schema-compliant responses.
    """

    def detect_toxicity(self, text: str) -> Tuple[float, bool]:
        if not text or len(text.strip()) < 3:
            return 0.0, False

        # Heuristic keyword check for deterministic stub behaviour
        toxic_keywords = [
            "kill", "hurt", "hate", "violence", "attack",
            "threat", "abuse", "destroy", "die", "murder",
        ]
        text_lower = text.lower()
        matched = sum(1 for kw in toxic_keywords if kw in text_lower)
        score = min(1.0, matched * 0.3)
        is_toxic = score > settings.toxicity_threshold
        return score, is_toxic

    def detect_harmful_content(self, text: str) -> Tuple[float, bool, str]:
        if not text or len(text.strip()) < 3:
            return 0.0, False, "none"

        harmful_categories = {
            "violence": ["kill", "hurt", "attack", "fight", "murder", "weapon", "destroy"],
            "hate_speech": ["hate", "racist", "discriminat", "slur", "bigot"],
            "sexual_content": ["porn", "nude", "explicit", "nsfw", "xxx"],
            "harassment": ["bully", "harass", "stalk", "intimidat", "threat"],
        }

        text_lower = text.lower()
        best_category = "safe content"
        best_score = 0.0

        for category, keywords in harmful_categories.items():
            matched = sum(1 for kw in keywords if kw in text_lower)
            cat_score = min(1.0, matched * 0.35)
            if cat_score > best_score:
                best_score = cat_score
                best_category = category

        is_harmful = best_score > settings.toxicity_threshold
        if not is_harmful:
            best_category = "safe content"

        return best_score, is_harmful, best_category

    def extract_key_phrases(self, text: str) -> list:
        if not text:
            return []
        words = text.lower().split()
        # Simple: return unique words > 3 chars
        return list(set(w for w in words if len(w) > 3 and w.isalnum()))[:10]


class NLPPipeline:
    """
    NLP-based content moderation
    """

    def __init__(self):
        """Initialize NLP models (lazy — only called on first use)"""
        try:
            import torch
            from transformers import pipeline

            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading NLP models on device: {self.device}")

            # Toxicity detection model
            self.toxicity_classifier = pipeline(
                "text-classification",
                model=settings.nlp_model_name,
                device=0 if self.device == "cuda" else -1
            )

            # Zero-shot classification for harmful content detection
            self.zeroshot_classifier = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
                device=0 if self.device == "cuda" else -1
            )

            self._stub = False
            logger.info("✅ NLP models loaded successfully")

        except Exception as e:
            logger.warning(
                f"⚠️ Failed to load NLP models, using deterministic stub: {e}"
            )
            self._stub = True
            self._fallback = NLPPipelineStub()

    def detect_toxicity(self, text: str) -> Tuple[float, bool]:
        """
        Detect toxic/offensive content
        Returns: (toxicity_score, is_toxic)
        """
        if self._stub:
            return self._fallback.detect_toxicity(text)

        if not text or len(text.strip()) < 3:
            return 0.0, False

        try:
            result = self.toxicity_classifier(
                text[:512])  # Limit to 512 tokens
            scores = {item["label"]: item["score"] for item in result}

            # Assume binary classification: TOXIC vs NON-TOXIC
            toxicity_score = max(scores.values())
            is_toxic = toxicity_score > settings.toxicity_threshold

            logger.debug(
                f"Toxicity detection: score={toxicity_score:.3f}, toxic={is_toxic}")
            return toxicity_score, is_toxic

        except Exception as e:
            logger.error(f"Toxicity detection failed: {e}")
            return 0.5, False  # Return neutral score on error

    def detect_harmful_content(self, text: str) -> Tuple[float, bool, str]:
        """
        Detect harmful content (violence, hate speech, sexual_content, etc.)
        Uses zero-shot classification
        Returns: (harm_score, is_harmful, category)
        """
        if self._stub:
            return self._fallback.detect_harmful_content(text)

        if not text or len(text.strip()) < 3:
            return 0.0, False, "none"

        try:
            candidate_labels = [
                "harmful content",
                "hate speech",
                "violence",
                "sexual_content",
                "discrimination",
                "safe content"
            ]

            result = self.zeroshot_classifier(
                text[:512],
                candidate_labels,
                multi_class=False
            )

            top_label = result["labels"][0]
            top_score = result["scores"][0]

            is_harmful = top_label != "safe content"
            harm_score = top_score if is_harmful else 1 - top_score

            logger.debug(
                f"Harmful content detection: category={top_label}, score={harm_score:.3f}")
            return harm_score, is_harmful, top_label

        except Exception as e:
            logger.error(f"Harmful content detection failed: {e}")
            return 0.5, False, "unknown"

    def extract_key_phrases(self, text: str) -> list:
        """
        Extract key phrases for document categorization
        """
        if self._stub:
            return self._fallback.extract_key_phrases(text)

        try:
            # Simple keyword extraction using NLP
            from nltk.corpus import stopwords
            from nltk.tokenize import word_tokenize
            import nltk

            nltk.download("stopwords", quiet=True)
            nltk.download("punkt", quiet=True)

            stop_words = set(stopwords.words("english"))
            tokens = word_tokenize(text.lower()[:512])
            keywords = [token for token in tokens if token.isalnum()
                        and token not in stop_words]

            return list(set(keywords))[:10]  # Top 10 unique keywords

        except Exception as e:
            logger.error(f"Keyword extraction failed: {e}")
            return self._fallback.extract_key_phrases(text) if self._stub else []


# Global NLP pipeline instance — lazy-loaded
_nlp_pipeline: NLPPipeline = None


def get_nlp_pipeline() -> NLPPipeline:
    """
    Lazy-load NLP pipeline
    """
    global _nlp_pipeline
    if _nlp_pipeline is None:
        _nlp_pipeline = NLPPipeline()
    return _nlp_pipeline
