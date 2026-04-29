"""
Document Text Extraction Pipeline
Extracts text from PDF and DOCX files for moderation
"""
import io
from typing import Optional
from app.utils.logger import logger


def extract_text_from_pdf(file_bytes: bytes) -> Optional[str]:
    """
    Extract text content from a PDF file using pdfminer.
    Returns None on failure.
    """
    try:
        from pdfminer.high_level import extract_text as pdfminer_extract
        text = pdfminer_extract(io.BytesIO(file_bytes))
        return text.strip() if text else None
    except Exception as e:
        logger.error(f"PDF text extraction failed: {e}")
        return None


def extract_text_from_docx(file_bytes: bytes) -> Optional[str]:
    """
    Extract text content from a DOCX file using python-docx.
    Returns None on failure.
    """
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs) if paragraphs else None
    except Exception as e:
        logger.error(f"DOCX text extraction failed: {e}")
        return None


def extract_text_from_file(file_bytes: bytes, content_type: str) -> Optional[str]:
    """
    Route extraction to the correct handler based on content type.
    Supported: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
    """
    if "pdf" in content_type:
        return extract_text_from_pdf(file_bytes)
    elif "wordprocessingml" in content_type or "docx" in content_type:
        return extract_text_from_docx(file_bytes)
    else:
        logger.warning(f"Unsupported document content type: {content_type}")
        return None
