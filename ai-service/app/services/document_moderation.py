"""
Document Moderation Service
Orchestrates NLP and CV pipelines for document safety analysis
"""
import time
import hashlib
from typing import Optional
from app.models.schemas import DocumentAnalysisResponse, DocumentSafetyEnum
from app.pipelines.nlp import get_nlp_pipeline
from app.pipelines.cv import get_cv_pipeline
from app.pipelines.moderation import get_hybrid_moderator
from app.utils.logger import logger
from datetime import datetime


class DocumentModerationService:
    """
    Analyzes documents for safety, toxicity, and NSFW content
    """

    def __init__(self):
        self.nlp_pipeline = get_nlp_pipeline()
        self.cv_pipeline = get_cv_pipeline()
        self.moderator = get_hybrid_moderator()

    async def analyze_document(
        self,
        document_id: int,
        content_type: str,
        text_content: Optional[str] = None,
        image_url: Optional[str] = None,
    ) -> DocumentAnalysisResponse:
        """
        Comprehensive document safety analysis
        Returns structured response with safety verdict
        """
        start_time = time.time()
        logger.info(f"Analyzing document {document_id} (type: {content_type})")

        from app.utils.cache import moderation_cache
        if text_content:
            cached_result = moderation_cache.get(text_content)
            if cached_result:
                logger.info("cache hit")
                return cached_result

        toxicity_score = 0.0
        nsfw_score = None
        reason_list = []
        is_safe = True

        detected_terms = []
        lang_detected = "unknown"
        requires_human_review = False
        toxicity_level = "none"
        toxicity_type = "none"
        model_version = "1.0.0"

        # ═══════════════════════════════════════════════════════════════
        # Text Analysis
        # ═══════════════════════════════════════════════════════════════
        if content_type in ["text", "pdf"] and text_content:
            logger.debug("Performing hybrid moderation analysis on text content")

            # Hybrid Toxicity check
            mod_result = self.moderator.moderate_document(text_content)
            toxicity_score = mod_result["toxicity_score"]
            is_toxic = mod_result["is_toxic"]
            detected_terms = mod_result["detected_terms"]
            lang_detected = mod_result["language_detected"]
            toxicity_level = mod_result.get("toxicity_level")
            toxicity_type = mod_result.get("toxicity_type")
            model_version = mod_result.get("model_version")

            if mod_result["requires_human_review"]:
                requires_human_review = True

            if is_toxic:
                is_safe = False
                reason_list.append(
                    f"Toxic content detected (score: {toxicity_score:.2f})")

            # Harmful content check
            harm_score, is_harmful, harm_category = self.nlp_pipeline.detect_harmful_content(
                text_content
            )

            if is_harmful:
                is_safe = False
                reason_list.append(
                    f"{harm_category} detected (score: {harm_score:.2f})")
            
            # New field population logic
            try:
                from langdetect import detect
                lang_detected = detect(text_content)
                if lang_detected not in ["ar", "fr", "en"]:
                    lang_detected = "mixed"
            except Exception:
                lang_detected = "unknown"

            if toxicity_score >= 0.8:
                toxicity_level = "high"
            elif toxicity_score >= 0.5:
                toxicity_level = "medium"
            elif toxicity_score >= 0.3:
                toxicity_level = "low"
            else:
                toxicity_level = "none"

            if harm_category and "hate" in harm_category.lower():
                toxicity_type = "hate"
            elif harm_category and "violence" in harm_category.lower():
                toxicity_type = "harassment"
            elif toxicity_score > 0 and toxicity_type in [None, "none"]:
                toxicity_type = "insult"
            
            # Add simple detected terms
            toxic_terms = ["idiot", "stupid", "hate", "kill", "die"]
            detected_terms = [t for t in toxic_terms if t in text_content.lower()][:5]
            if detected_terms and toxicity_type in [None, "none"]:
                toxicity_type = "profanity"

        # ═══════════════════════════════════════════════════════════════
        # Image Analysis
        # ═══════════════════════════════════════════════════════════════
        if content_type in ["image", "mixed"] and image_url:
            logger.debug("Performing CV analysis on image")

            # NSFW check
            nsfw_score_val, is_nsfw = self.cv_pipeline.detect_nsfw(image_url)
            nsfw_score = nsfw_score_val

            if is_nsfw:
                is_safe = False
                reason_list.append(
                    f"NSFW content detected (score: {nsfw_score_val:.2f})")

            # Image quality check (now returns dict)
            quality_info = self.cv_pipeline.detect_image_quality(image_url)
            is_clear = quality_info.get("is_clear", False)
            quality_score = quality_info.get("quality_score", 0.0)

            if not is_clear:
                reason_list.append(
                    f"Image quality too low for reliable analysis (score: {quality_score:.2f})")

        # ═══════════════════════════════════════════════════════════════
        # Determine Safety Level and Action
        # ═══════════════════════════════════════════════════════════════
        if not is_safe:
            safety_level = DocumentSafetyEnum.UNSAFE
            action = "reject"
            confidence = max(toxicity_score, nsfw_score or 0.0)
        elif reason_list:
            # Some issues but not critical
            safety_level = DocumentSafetyEnum.REVIEW_REQUIRED
            action = "review"
            confidence = 0.6
        else:
            safety_level = DocumentSafetyEnum.SAFE
            action = "approve"
            confidence = 0.95

        # ═══════════════════════════════════════════════════════════════
        # Build Response
        # ═══════════════════════════════════════════════════════════════
        reason = "; ".join(
            reason_list) if reason_list else "Document passed all safety checks"

        response = DocumentAnalysisResponse(
            document_id=document_id,
            is_safe=is_safe,
            safety_level=safety_level,
            confidence=confidence,
            toxicity_score=toxicity_score,
            nsfw_score=nsfw_score,
            reason=reason,
            action=action,
            analysis_timestamp=datetime.utcnow(),
            detected_terms=detected_terms,
            language_detected=lang_detected,
            requires_human_review=requires_human_review,
            toxicity_level=toxicity_level,
            toxicity_type=toxicity_type,
            model_version=model_version,
        )

        latency_ms = (time.time() - start_time) * 1000

        # Structured observability log
        logger.info(
            f"Document {document_id} analysis complete",
            extra={
                "event": "moderation_request",
                "endpoint": "/documents/analyze",
                "latency_ms": round(latency_ms, 2),
                "is_toxic": not is_safe,
                "action": action,
                "confidence": round(confidence, 4),
                "input_hash": hashlib.sha256(
                    (text_content or "").encode()
                ).hexdigest()[:16],
            },
        )

        if text_content:
            moderation_cache.set(text_content, response)

        return response


# Global service instance — lazy-loaded
_moderation_service: DocumentModerationService = None


def get_moderation_service() -> DocumentModerationService:
    """
    Lazy-load moderation service
    """
    global _moderation_service
    if _moderation_service is None:
        _moderation_service = DocumentModerationService()
    return _moderation_service

