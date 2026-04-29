"""
Hybrid Multilingual Moderation Pipeline
Combines Rule-Based Lexicon and AI Model for detecting toxicity
Enterprise-grade with caching, tiered severity, language detection,
and FAISS deduplication
"""
import re
import hashlib
from typing import Tuple, List, Dict, Any
from app.core.config import settings
from app.utils.logger import logger
from app.utils.cache import moderation_cache, TTLCache


# ═══════════════════════════════════════════════════════════════════
# Toxicity type classifier (rule-based categories)
# ═══════════════════════════════════════════════════════════════════
_TOXICITY_TYPE_KEYWORDS = {
    "insult": [
        "stupid", "idiot", "dumb", "غبي", "حمار", "débile", "nul", "hmar",
        "conne", "con",
    ],
    "harassment": [
        "bitch", "asshole", "cunt", "salope", "connard", "شرموط", "قحبه",
        "kelb", "nik",
    ],
    "hate": [
        "racist", "discriminat", "bigot", "hate", "كلب", "حقير", "bâtard",
        "zbel",
    ],
    "profanity": [
        "fuck", "shit", "merde", "خرا", "khra", "putain", "trash", "garbage",
        "zebi",
    ],
}


class HybridModerationPipeline:
    def __init__(self):
        self.lexicon = {
            "ar": ["غبي", "حمار", "كلب", "حقير", "خرا", "زبال", "قحبه", "شرموط", "نيتش"],
            "fr": ["idiot", "nul", "connard", "merde", "débile", "conne", "salope", "putain", "bâtard", "con"],
            "en": ["stupid", "trash", "idiot", "garbage", "dumb", "fuck", "shit", "bitch", "asshole", "cunt"],
            "arabizi": ["khra", "hmar", "zbel", "t7an", "kavi", "nik", "zebi", "kelb"]
        }

        # Flatten and compile regex for bad words (handling repeated letters and some substitutions)
        self.bad_words_patterns = []
        for lang, words in self.lexicon.items():
            for word in words:
                # Create a pattern that allows repeated characters (e.g., "stuuupid")
                # and basic misspellings or symbol replacements (e.g., "sh*t" -> "sh.*t")
                pattern_str = r'\b' + r'+'.join([re.escape(c) for c in word]) + r'+\b'
                # Handle common censored substitutions
                pattern_str = pattern_str.replace('a', '[a@*]')
                pattern_str = pattern_str.replace('i', '[i!*1]')
                pattern_str = pattern_str.replace('o', '[o0*]')
                pattern_str = pattern_str.replace('e', '[e3*]')
                pattern_str = pattern_str.replace('s', '[s$*5]')
                self.bad_words_patterns.append(re.compile(pattern_str, re.IGNORECASE))

        self._init_model()

    def _init_model(self):
        try:
            import torch
            from transformers import pipeline
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading moderation model on {self.device}")

            # Primary model
            model_name = "unitary/toxic-xlm-roberta"
            try:
                self.ai_model = pipeline(
                    "text-classification",
                    model=model_name,
                    device=0 if self.device == "cuda" else -1
                )
                logger.info(f"✅ Moderation model {model_name} loaded successfully")
            except Exception:
                logger.warning(f"Failed to load {model_name}, falling back to {settings.nlp_model_name}")
                self.ai_model = pipeline(
                    "text-classification",
                    model=settings.nlp_model_name,
                    device=0 if self.device == "cuda" else -1
                )
                logger.info(f"✅ Fallback model {settings.nlp_model_name} loaded successfully")
            self._stub = False
        except Exception as e:
            logger.error(f"Moderation model init failed, using rule-based fallback: {e}")
            self._stub = True

    # ───────────────────────────────────────────────────────────────
    # Text Normalization
    # ───────────────────────────────────────────────────────────────
    def normalize_text(self, text: str) -> str:
        """Clean and standardize multilingual input"""
        if not text:
            return ""
        # Lowercase
        text = text.lower()
        # Remove extra spaces
        text = re.sub(r'\s+', ' ', text).strip()
        # Normalize French accents
        text = re.sub(r'[éèêë]', 'e', text)
        text = re.sub(r'[àâä]', 'a', text)
        text = re.sub(r'[ùûü]', 'u', text)
        text = re.sub(r'[îï]', 'i', text)
        text = re.sub(r'[ôö]', 'o', text)
        text = re.sub(r'[ç]', 'c', text)
        # Normalize Arabic characters
        text = re.sub(r'[أإآا]', 'ا', text)
        text = re.sub(r'[ة]', 'ه', text)
        # Reduce repeated characters to max 2
        text = re.sub(r'(.)\1{2,}', r'\1\1', text)
        return text

    # ───────────────────────────────────────────────────────────────
    # Rule-Based Detection
    # ───────────────────────────────────────────────────────────────
    def detect_bad_words(self, text: str) -> Tuple[List[str], float]:
        """Detect toxic words using rule-based lexicon"""
        matched_words = set()
        for pattern in self.bad_words_patterns:
            matches = pattern.findall(text)
            if matches:
                matched_words.update(matches)

        # Calculate severity score based on matches
        num_matches = len(matched_words)
        rule_score = min(1.0, num_matches * 0.4)  # Each word adds 0.4 to score
        return list(matched_words), rule_score

    # ───────────────────────────────────────────────────────────────
    # AI Model Prediction (with fallback)
    # ───────────────────────────────────────────────────────────────
    def predict_toxicity(self, text: str) -> float:
        """Use HuggingFace pipeline for AI toxicity detection"""
        if self._stub:
            # Fallback: rule-based heuristic provides the score
            _, rule_score = self.detect_bad_words(text)
            return rule_score

        try:
            # Max 512 tokens
            result = self.ai_model(text[:512])

            # Extract probability score
            scores = {item["label"].lower(): item["score"] for item in result}

            if "toxic" in scores:
                return scores["toxic"]
            elif "toxicity" in scores:
                return scores["toxicity"]
            elif "positive" in scores and "negative" in scores:
                # Sentiment model: high negative is toxic
                return scores["negative"]
            else:
                # Default max score
                return max(scores.values())
        except Exception as e:
            logger.error(f"AI toxicity prediction failed, using rule fallback: {e}")
            # Fallback to rule-based
            _, rule_score = self.detect_bad_words(text)
            return rule_score

    # ───────────────────────────────────────────────────────────────
    # Fusion Logic
    # ───────────────────────────────────────────────────────────────
    def combine_results(self, rule_score: float, ai_score: float) -> Tuple[bool, float]:
        """Fusion Logic (rules + AI score)"""
        final_score = max(rule_score, ai_score)

        # Threshold logic
        threshold = settings.toxicity_threshold

        if rule_score >= 0.8:
            # High rule score is definitely toxic
            return True, final_score
        elif ai_score > threshold:
            # AI score exceeds threshold
            return True, final_score
        elif final_score > 0.6:
            # Combined or medium high score
            return True, final_score

        return False, final_score

    # ───────────────────────────────────────────────────────────────
    # Language Detection
    # ───────────────────────────────────────────────────────────────
    @staticmethod
    def detect_language(text: str) -> str:
        """Detect dominant language from text content"""
        has_arabic = bool(re.search(r'[\u0600-\u06FF]', text))
        has_latin = bool(re.search(r'[a-zA-Z]', text))

        # Heuristic for French vs English (common French words)
        french_markers = {"le", "la", "les", "de", "du", "des", "un", "une",
                          "et", "est", "en", "que", "qui", "dans", "pour",
                          "pas", "sur", "ce", "sont", "avec", "tout", "nous"}
        words = set(re.findall(r'[a-zA-Z]+', text.lower()))
        french_ratio = len(words & french_markers) / max(len(words), 1)

        if has_arabic and has_latin:
            return "mixed"
        elif has_arabic:
            return "ar"
        elif french_ratio > 0.15:
            return "fr"
        else:
            return "en"

    # ───────────────────────────────────────────────────────────────
    # Toxicity Level & Type Classification
    # ───────────────────────────────────────────────────────────────
    @staticmethod
    def classify_toxicity_level(score: float) -> str:
        """Map score to human-readable severity level"""
        if score >= settings.high_toxicity_threshold:
            return "high"
        elif score >= settings.toxicity_threshold:
            return "medium"
        else:
            return "low"

    @staticmethod
    def classify_toxicity_type(detected_terms: List[str], text: str) -> str:
        """Determine the dominant toxicity category"""
        text_lower = text.lower()
        best_category = "profanity"
        best_count = 0

        for category, keywords in _TOXICITY_TYPE_KEYWORDS.items():
            count = sum(1 for kw in keywords if kw in text_lower)
            # Also check if any detected terms match this category's keywords
            for term in detected_terms:
                if term.lower() in [k.lower() for k in keywords]:
                    count += 2  # Weighted boost for lexicon matches
            if count > best_count:
                best_count = count
                best_category = category

        return best_category if best_count > 0 else "unknown"

    # ───────────────────────────────────────────────────────────────
    # Main Entry Point (with caching + dedup)
    # ───────────────────────────────────────────────────────────────
    def moderate_document(self, text: str) -> Dict[str, Any]:
        """
        Main entrypoint for moderation.
        Returns enriched result with toxicity level, type, language, and model version.
        Results are cached by input hash to avoid reprocessing identical content.
        """
        # ── Cache check (deduplication) ──
        cached = moderation_cache.get(text)
        if cached is not None:
            logger.debug("Moderation cache hit — returning cached result")
            return cached

        # ── Pipeline execution ──
        normalized = self.normalize_text(text)
        detected_terms, rule_score = self.detect_bad_words(normalized)
        ai_score = self.predict_toxicity(normalized)
        is_toxic, final_score = self.combine_results(rule_score, ai_score)

        lang_detected = self.detect_language(text)
        toxicity_level = self.classify_toxicity_level(final_score) if is_toxic else "low"
        toxicity_type = self.classify_toxicity_type(detected_terms, normalized) if is_toxic else "none"

        result = {
            "is_toxic": is_toxic,
            "toxicity_score": round(final_score, 4),
            "toxicity_level": toxicity_level,
            "toxicity_type": toxicity_type,
            "detected_terms": detected_terms,
            "language_detected": lang_detected,
            "requires_human_review": is_toxic or (final_score > 0.4),
            "model_version": settings.app_version,
        }

        # ── Cache store ──
        moderation_cache.set(text, result)

        return result


# Global service instance — lazy-loaded
_hybrid_moderator: HybridModerationPipeline = None


def get_hybrid_moderator() -> HybridModerationPipeline:
    """Lazy-load moderation pipeline"""
    global _hybrid_moderator
    if _hybrid_moderator is None:
        _hybrid_moderator = HybridModerationPipeline()
    return _hybrid_moderator
