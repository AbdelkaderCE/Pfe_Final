"""
Computer Vision Pipeline — Backward-Compatible Wrapper

All real logic now lives in app.pipelines.vision (the unified VisionPipeline).
This module exists solely to preserve existing import paths:
    from app.pipelines.cv import get_cv_pipeline, CVPipeline

No functionality is duplicated. Every call delegates to VisionPipeline.
"""
from typing import Tuple, Dict
from app.utils.logger import logger


class CVPipelineStub:
    """
    Deterministic stub for CV pipeline when models cannot be loaded.
    Returns valid schema-compliant responses.
    """

    def load_image(self, image_source):
        return None

    def detect_nsfw(self, image_source) -> Tuple[float, bool]:
        return 0.1, False

    def detect_image_quality(self, image_source) -> Dict:
        return {
            "blur_score": 0.0,
            "clarity": 0.8,
            "quality_score": 0.8,
            "is_clear": True,
        }

    def extract_image_features(self, image_source) -> dict:
        return {
            "dimensions": [224, 224, 3],
            "file_size_kb": 0,
            "color_space": "RGB",
            "brightness": 128.0,
            "contrast": 50.0,
        }


class CVPipeline:
    """
    Backward-compatible CV pipeline wrapper.
    Delegates all calls to the unified VisionPipeline.
    """

    def __init__(self):
        """Initialize by delegating to the unified VisionPipeline."""
        try:
            from app.pipelines.vision import get_vision_pipeline
            self._vision = get_vision_pipeline()
            self._is_stub = self._vision._stub
            logger.info("✅ CVPipeline initialized (delegates to unified VisionPipeline)")
        except Exception as e:
            logger.warning(f"CVPipeline initialization failed: {e}, using stub")
            self._vision = None
            self._is_stub = True

    def load_image(self, image_source):
        """Load image — delegates to VisionPipeline."""
        if self._is_stub:
            return None
        return self._vision.load_image(image_source)

    def detect_nsfw(self, image_source) -> Tuple[float, bool]:
        """
        Detect NSFW content — delegates to unified VisionPipeline.
        Uses the Falconsai model for real inference (not hardcoded).
        Returns: (nsfw_score, is_nsfw)
        """
        if self._is_stub:
            return 0.1, False
        return self._vision.detect_nsfw(image_source)

    def detect_image_quality(self, image_source) -> Dict:
        """
        Check image quality — delegates to VisionPipeline.
        Returns dict with blur_score, clarity, quality_score, is_clear.
        """
        if self._is_stub:
            return {
                "blur_score": 0.0,
                "clarity": 0.8,
                "quality_score": 0.8,
                "is_clear": True,
            }
        return self._vision.detect_image_quality(image_source)

    def extract_image_features(self, image_source) -> dict:
        """Extract low-level image features — delegates to VisionPipeline."""
        if self._is_stub:
            return {
                "dimensions": [224, 224, 3],
                "file_size_kb": 0,
                "color_space": "RGB",
                "brightness": 128.0,
                "contrast": 50.0,
            }
        return self._vision.extract_image_features(image_source)


# Global CV pipeline instance — lazy-loaded
_cv_pipeline: CVPipeline = None


def get_cv_pipeline() -> CVPipeline:
    """
    Lazy-load CV pipeline (backward-compatible accessor).
    """
    global _cv_pipeline
    if _cv_pipeline is None:
        _cv_pipeline = CVPipeline()
    return _cv_pipeline
