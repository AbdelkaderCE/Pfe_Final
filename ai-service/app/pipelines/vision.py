"""
Unified Multimodal Vision Pipeline
OCR, NSFW detection, and Image classification for moderation.

This is the single source of truth for all image analysis.
The legacy cv.py module delegates to this pipeline for backward compatibility.
"""
import io
import asyncio
import numpy as np
from PIL import Image
from typing import Dict, Any, Tuple
from app.utils.logger import logger
from app.core.config import settings


class VisionPipeline:
    """
    Unified vision pipeline that consolidates:
    - EasyOCR text extraction (async-safe via threadpool)
    - NSFW / image toxicity detection (Falconsai model)
    - Image quality analysis (Laplacian variance)
    - Image feature extraction
    - Full image moderation (OCR + text mod + image classification)
    """

    def __init__(self):
        self._init_models()

    def _init_models(self):
        try:
            import torch
            import easyocr
            from transformers import pipeline
            self.device = "cuda" if torch.cuda.is_available() else "cpu"

            logger.info(f"Loading vision models on {self.device}")

            # EasyOCR reader for Arabic, French, English
            self.reader = easyocr.Reader(['ar', 'fr', 'en'], gpu=(self.device == 'cuda'))

            # Image moderation model (Falconsai NSFW detector)
            self.image_classifier = pipeline(
                "image-classification",
                model="Falconsai/nsfw_image_detection",
                device=0 if self.device == "cuda" else -1,
            )

            self._stub = False
            logger.info("✅ Vision models loaded successfully")
        except Exception as e:
            logger.error(f"Vision model init failed: {e}")
            self._stub = True
            self.reader = None
            self.image_classifier = None
            self.device = "cpu"

    # ─────────────────────────────────────────────────────────────────
    # Pre-warm (used by lifespan startup)
    # ─────────────────────────────────────────────────────────────────
    def pre_warm(self):
        """
        Run a dummy inference to pre-warm model caches.
        Called during application startup to avoid first-request latency.
        """
        if self._stub:
            logger.info("Vision pipeline in stub mode — skipping pre-warm")
            return

        try:
            # Warm the image classifier with a tiny dummy image
            dummy_img = Image.new("RGB", (64, 64), color=(128, 128, 128))
            self.image_classifier(dummy_img)

            # Warm EasyOCR with a tiny dummy image
            dummy_np = np.zeros((64, 64, 3), dtype=np.uint8)
            self.reader.readtext(dummy_np)

            logger.info("✅ Vision models pre-warmed successfully")
        except Exception as e:
            logger.warning(f"Vision pre-warm partial failure (non-fatal): {e}")

    # ═══════════════════════════════════════════════════════════════
    # Image Loading (shared utility)
    # ═══════════════════════════════════════════════════════════════
    def load_image(self, image_source) -> Image.Image:
        """
        Load image from URL, file path, or bytes.
        Returns a PIL Image in RGB mode, or None on failure.
        """
        try:
            if isinstance(image_source, bytes):
                image = Image.open(io.BytesIO(image_source))
            elif isinstance(image_source, str):
                if image_source.startswith(("http://", "https://")):
                    import requests
                    response = requests.get(image_source, timeout=10)
                    image = Image.open(io.BytesIO(response.content))
                else:
                    image = Image.open(image_source)
            elif isinstance(image_source, Image.Image):
                image = image_source
            else:
                logger.error(f"Unsupported image source type: {type(image_source)}")
                return None

            # Convert to RGB if necessary
            if image.mode != "RGB":
                image = image.convert("RGB")

            return image

        except Exception as e:
            logger.error(f"Failed to load image: {e}")
            return None

    # ═══════════════════════════════════════════════════════════════
    # OCR Text Extraction (blocking — use async wrapper in endpoints)
    # ═══════════════════════════════════════════════════════════════
    def _extract_text_sync(self, image_bytes: bytes) -> str:
        """Synchronous OCR — internal use only."""
        if self._stub:
            return ""
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(image)
            results = self.reader.readtext(img_np)
            extracted = " ".join([res[1] for res in results])
            return extracted
        except Exception as e:
            logger.error(f"OCR failed: {e}")
            return ""

    def extract_text_from_image(self, image_bytes: bytes) -> str:
        """
        Synchronous OCR wrapper (backward-compatible).
        For async contexts, use extract_text_from_image_async instead.
        """
        return self._extract_text_sync(image_bytes)

    async def extract_text_from_image_async(self, image_bytes: bytes) -> str:
        """
        Async-safe OCR — runs EasyOCR in a threadpool executor
        to avoid blocking the FastAPI event loop.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._extract_text_sync, image_bytes)

    # ═══════════════════════════════════════════════════════════════
    # NSFW / Image Toxicity Detection (real model inference)
    # ═══════════════════════════════════════════════════════════════
    def detect_nsfw(self, image_source) -> Tuple[float, bool]:
        """
        Detect NSFW content using the Falconsai model.
        Returns: (nsfw_score, is_nsfw)

        This replaces the old hardcoded cv.py implementation.
        Accepts: URL string, file path string, bytes, or PIL Image.
        """
        if self._stub:
            return 0.1, False

        try:
            image = self.load_image(image_source)
            if image is None:
                return 0.5, False

            # Resize if too large to prevent memory issues
            if max(image.size) > 1024:
                image.thumbnail((1024, 1024))

            results = self.image_classifier(image)
            scores = {item["label"].lower(): item["score"] for item in results}

            # Extract NSFW score from model output
            nsfw_score = scores.get("nsfw", 0.0)

            # If the model uses different labels, check common alternatives
            if nsfw_score == 0.0:
                for label in ["porn", "sexy", "hentai", "unsafe"]:
                    if label in scores:
                        nsfw_score = max(nsfw_score, scores[label])

            is_nsfw = nsfw_score > settings.nsfw_threshold

            logger.debug(
                f"NSFW detection: score={nsfw_score:.3f}, nsfw={is_nsfw}, "
                f"raw_labels={scores}"
            )
            return nsfw_score, is_nsfw

        except Exception as e:
            logger.error(f"NSFW detection failed: {e}")
            return 0.5, False

    def detect_image_toxicity(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Full image toxicity analysis including NSFW and violence detection.
        Returns dict with is_toxic_image, confidence, labels.
        """
        if self._stub:
            return {"is_toxic_image": False, "confidence": 0.0, "labels": []}
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            # Resize if too large to prevent memory issues
            if max(image.size) > 1024:
                image.thumbnail((1024, 1024))

            results = self.image_classifier(image)
            scores = {item["label"].lower(): item["score"] for item in results}

            # Determine toxicity
            is_toxic = False
            confidence = 0.0
            labels = []

            if "nsfw" in scores and scores["nsfw"] > 0.5:
                is_toxic = True
                confidence = scores["nsfw"]
                labels.append("nsfw")
            elif "violence" in scores and scores["violence"] > 0.5:
                is_toxic = True
                confidence = scores["violence"]
                labels.append("violence")
            else:
                confidence = max(scores.values()) if scores else 0.0

            return {
                "is_toxic_image": is_toxic,
                "confidence": confidence,
                "labels": labels
            }
        except Exception as e:
            logger.error(f"Image toxicity detection failed: {e}")
            return {"is_toxic_image": False, "confidence": 0.0, "labels": []}

    # ═══════════════════════════════════════════════════════════════
    # Image Quality Analysis (ported from cv.py)
    # ═══════════════════════════════════════════════════════════════
    def detect_image_quality(self, image_source) -> Dict:
        """
        Check image quality and clarity using Laplacian variance.
        Returns dict with blur_score, clarity, quality_score, is_clear.
        """
        try:
            import cv2

            image = self.load_image(image_source)
            if image is None:
                return {
                    "blur_score": 0.0,
                    "clarity": 0.0,
                    "quality_score": 0.0,
                    "is_clear": False,
                }

            # Convert to grayscale
            gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)

            # Laplacian variance (blur detection)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            # Normalize to 0-1 range (higher variance = sharper image)
            quality_score = min(1.0, laplacian_var / 500)
            blur_score = 1.0 - quality_score
            clarity = quality_score
            is_clear = quality_score > 0.3

            logger.debug(
                f"Image quality: blur_score={blur_score:.3f}, clarity={clarity:.3f}")
            return {
                "blur_score": blur_score,
                "clarity": clarity,
                "quality_score": quality_score,
                "is_clear": is_clear,
            }

        except Exception as e:
            logger.error(f"Image quality detection failed: {e}")
            return {
                "blur_score": 0.0,
                "clarity": 0.0,
                "quality_score": 0.0,
                "is_clear": False,
            }

    # ═══════════════════════════════════════════════════════════════
    # Image Feature Extraction (ported from cv.py)
    # ═══════════════════════════════════════════════════════════════
    def extract_image_features(self, image_source) -> dict:
        """
        Extract low-level image features (dimensions, brightness, contrast).
        """
        try:
            image = self.load_image(image_source)
            if image is None:
                return {}

            img_array = np.array(image)

            return {
                "dimensions": list(img_array.shape),
                "file_size_kb": len(img_array.tobytes()) / 1024,
                "color_space": "RGB",
                "brightness": float(np.mean(img_array)),
                "contrast": float(np.std(img_array)),
            }

        except Exception as e:
            logger.error(f"Image feature extraction failed: {e}")
            return {}

    # ═══════════════════════════════════════════════════════════════
    # Full Image Moderation (OCR + text mod + image classification)
    # ═══════════════════════════════════════════════════════════════
    def process_image_moderation(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Full multimodal image moderation pipeline:
        1. OCR text extraction
        2. Text moderation on extracted text
        3. Image classification (NSFW)
        4. Fusion logic
        """
        # Lazy import to avoid circular dependency
        from app.pipelines.moderation import get_hybrid_moderator
        text_moderator = get_hybrid_moderator()

        # 1. Extract text
        extracted_text = self.extract_text_from_image(image_bytes)

        # 2. Text Moderation
        text_toxic = False
        text_confidence = 0.0
        toxicity_type = None
        language_detected = None
        if extracted_text.strip():
            text_mod_result = text_moderator.moderate_document(extracted_text)
            text_toxic = text_mod_result["is_toxic"]
            text_confidence = text_mod_result["toxicity_score"]
            toxicity_type = text_mod_result.get("toxicity_type")
            language_detected = text_mod_result.get("language_detected")

        # 3. Image Classification
        img_result = self.detect_image_toxicity(image_bytes)
        img_toxic = img_result["is_toxic_image"]
        img_confidence = img_result["confidence"]

        # 4. Fusion Logic
        is_toxic = img_toxic or text_toxic
        final_confidence = max(img_confidence, text_confidence)

        return {
            "is_toxic": is_toxic,
            "is_visual_toxic": img_toxic,
            "is_text_toxic": text_toxic,
            "extracted_text": extracted_text,
            "confidence_score": final_confidence,
            "requires_human_review": is_toxic or (final_confidence > 0.4),
            "toxicity_type": toxicity_type,
            "language_detected": language_detected,
        }

    async def process_image_moderation_async(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Async-safe version of process_image_moderation.
        Runs OCR in threadpool to avoid blocking the event loop.
        """
        from app.pipelines.moderation import get_hybrid_moderator
        text_moderator = get_hybrid_moderator()

        # 1. Extract text (async — runs in threadpool)
        extracted_text = await self.extract_text_from_image_async(image_bytes)

        # 2. Text Moderation (CPU-bound but fast, acceptable in event loop)
        text_toxic = False
        text_confidence = 0.0
        toxicity_type = None
        language_detected = None
        if extracted_text.strip():
            text_mod_result = text_moderator.moderate_document(extracted_text)
            text_toxic = text_mod_result["is_toxic"]
            text_confidence = text_mod_result["toxicity_score"]
            toxicity_type = text_mod_result.get("toxicity_type")
            language_detected = text_mod_result.get("language_detected")

        # 3. Image Classification (run in threadpool)
        loop = asyncio.get_event_loop()
        img_result = await loop.run_in_executor(
            None, self.detect_image_toxicity, image_bytes
        )
        img_toxic = img_result["is_toxic_image"]
        img_confidence = img_result["confidence"]

        # 4. Fusion Logic
        is_toxic = img_toxic or text_toxic
        final_confidence = max(img_confidence, text_confidence)

        return {
            "is_toxic": is_toxic,
            "is_visual_toxic": img_toxic,
            "is_text_toxic": text_toxic,
            "extracted_text": extracted_text,
            "confidence_score": final_confidence,
            "requires_human_review": is_toxic or (final_confidence > 0.4),
            "toxicity_type": toxicity_type,
            "language_detected": language_detected,
        }


# ═══════════════════════════════════════════════════════════════
# Global singleton — lazy-loaded
# ═══════════════════════════════════════════════════════════════
_vision_pipeline: VisionPipeline = None


def get_vision_pipeline() -> VisionPipeline:
    """Lazy-load the unified vision pipeline."""
    global _vision_pipeline
    if _vision_pipeline is None:
        _vision_pipeline = VisionPipeline()
    return _vision_pipeline
