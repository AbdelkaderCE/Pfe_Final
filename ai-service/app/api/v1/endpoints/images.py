"""
API Endpoints for Image Moderation
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.models.schemas import ImageModerationResponse
from app.services.image_moderation import get_image_moderation_service, ImageModerationService
from app.utils.logger import logger
from app.core.config import settings

router = APIRouter(
    prefix="/images",
    tags=["Image Moderation"]
)

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"}


@router.post("/moderate", response_model=ImageModerationResponse)
async def moderate_image(
    file: UploadFile = File(...),
    service: ImageModerationService = Depends(get_image_moderation_service)
):
    """
    Moderate an uploaded image for toxic visual content and toxic text (OCR).

    Supported formats: JPEG, PNG, GIF, WebP, BMP.
    Max size: configurable via MAX_IMAGE_SIZE_MB (default 10 MB).
    """
    # Validate content type
    if file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Allowed: {', '.join(_ALLOWED_IMAGE_TYPES)}",
        )

    try:
        contents = await file.read()

        # Validate not empty
        if not contents:
            raise HTTPException(status_code=400, detail="Empty image file.")

        # Validate file size
        max_bytes = settings.max_image_size_mb * 1024 * 1024
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"Image too large ({len(contents)} bytes). Maximum: {max_bytes} bytes ({settings.max_image_size_mb} MB).",
            )

        result = await service.moderate_image(contents)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image moderation endpoint failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during image processing.")
