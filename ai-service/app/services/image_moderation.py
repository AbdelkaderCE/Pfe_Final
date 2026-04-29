"""
Image Moderation Service
Orchestrates the multimodal vision pipeline
"""
import time
import hashlib
from app.pipelines.vision import get_vision_pipeline
from app.utils.logger import logger
from app.models.schemas import ImageModerationResponse
from app.core.config import settings


class ImageModerationService:
    def __init__(self):
        self.vision_pipeline = get_vision_pipeline()

    async def moderate_image(self, image_bytes: bytes) -> ImageModerationResponse:
        start_time = time.time()
        logger.info("Processing image moderation request")

        result = await self.vision_pipeline.process_image_moderation_async(image_bytes)

        # Compute toxicity level from confidence score
        score = result["confidence_score"]
        if score >= settings.high_toxicity_threshold:
            toxicity_level = "high"
        elif score >= settings.toxicity_threshold:
            toxicity_level = "medium"
        else:
            toxicity_level = "low"

        response = ImageModerationResponse(
            is_toxic=result["is_toxic"],
            is_visual_toxic=result["is_visual_toxic"],
            is_text_toxic=result["is_text_toxic"],
            extracted_text=result["extracted_text"],
            confidence_score=result["confidence_score"],
            requires_human_review=result["requires_human_review"],
            toxicity_level=toxicity_level if result["is_toxic"] else None,
            toxicity_type=result.get("toxicity_type"),
            language_detected=result.get("language_detected"),
            model_version=settings.app_version,
        )

        latency_ms = (time.time() - start_time) * 1000
        logger.info(
            "Image moderation complete",
            extra={
                "event": "image_moderation_request",
                "endpoint": "/images/moderate",
                "latency_ms": round(latency_ms, 2),
                "is_toxic": result["is_toxic"],
                "input_hash": hashlib.sha256(image_bytes[:256]).hexdigest()[:16],
            },
        )

        return response


# Global service instance — lazy-loaded
_image_moderation_service: ImageModerationService = None


def get_image_moderation_service() -> ImageModerationService:
    global _image_moderation_service
    if _image_moderation_service is None:
        _image_moderation_service = ImageModerationService()
    return _image_moderation_service
