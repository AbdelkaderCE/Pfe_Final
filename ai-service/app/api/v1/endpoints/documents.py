"""
Document Moderation Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.security.rbac import RBACManager
from app.models.schemas import (
    UserInfo, DocumentAnalysisRequest, DocumentAnalysisResponse, ErrorResponse
)
from app.services.document_moderation import get_moderation_service
from app.utils.logger import logger

router = APIRouter(prefix="/api/v1/documents", tags=["Document Moderation"])


@router.post(
    "/analyze",
    response_model=DocumentAnalysisResponse,
    responses={
        403: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
async def analyze_document(
    request: DocumentAnalysisRequest,
    user: UserInfo = Depends(
        RBACManager.require_permission("documents:analyze")),
    db: Session = Depends(get_db),
):
    """
    Analyze document for safety, toxicity, and NSFW content

    **Required Role:** admin, enseignant

    **Request Body:**
    - document_id: Document identifier
    - content_type: "pdf", "text", "image", or "mixed"
    - text_content: Optional text content for NLP analysis
    - image_url: Optional image URL for CV analysis

    **Response:**
    - is_safe: Whether document passed all safety checks
    - safety_level: "safe", "unsafe", or "review_required"
    - confidence: Confidence score (0-1)
    - reason: Detailed reason for verdict
    - action: "approve", "reject", or "review"
    """
    try:
        logger.info(
            f"Document analysis request from user {user.id} "
            f"for document {request.document_id}"
        )

        # Input validation: reject empty text
        if request.content_type in ["text", "pdf"] and request.text_content is not None:
            stripped = request.text_content.strip()
            if len(stripped) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="text_content must not be empty when content_type is text or pdf.",
                )

        # Get moderation service
        moderation_service = get_moderation_service()

        # Perform analysis
        analysis_response = await moderation_service.analyze_document(
            document_id=request.document_id,
            content_type=request.content_type,
            text_content=request.text_content,
            image_url=request.image_url,
        )

        logger.info(
            f"Document {request.document_id} analysis: {analysis_response.action}")

        return analysis_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document analysis failed",
        )
