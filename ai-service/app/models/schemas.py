"""
Pydantic models for API requests and responses
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ═══════════════════════════════════════════════════════════════
# Enums
# ═══════════════════════════════════════════════════════════════
class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    ENSEIGNANT = "enseignant"
    ETUDIANT = "etudiant"


class DocumentSafetyEnum(str, Enum):
    SAFE = "safe"
    UNSAFE = "unsafe"
    REVIEW_REQUIRED = "review_required"


# ═══════════════════════════════════════════════════════════════
# JWT & Authentication Models
# ═══════════════════════════════════════════════════════════════
class JWTPayload(BaseModel):
    """JWT payload structure"""
    sub: int  # user_id
    email: str
    roles: List[str]
    iat: int
    exp: int


class UserInfo(BaseModel):
    """User information from JWT"""
    id: int
    email: str
    nom: str
    prenom: str
    roles: List[str]


# ═══════════════════════════════════════════════════════════════
# Document Moderation Models
# ═══════════════════════════════════════════════════════════════
class DocumentAnalysisRequest(BaseModel):
    document_id: int
    content_type: str  # "pdf", "image", "text"
    text_content: Optional[str] = Field(
        None,
        max_length=5000,       # Enforce 5000 char limit
        description="Text content for NLP analysis (max 5000 chars)"
    )
    image_url: Optional[str] = None
    
    @validator('text_content')
    def text_not_just_whitespace(cls, v):
        if v is not None and v.strip() == '':
            raise ValueError('text_content cannot be empty or whitespace only')
        return v
    
    @validator('image_url')
    def image_url_must_be_http(cls, v):
        if v is not None and not v.startswith(('http://', 'https://')):
            raise ValueError('image_url must be a valid HTTP/HTTPS URL')
        return v


class DocumentAnalysisResponse(BaseModel):
    document_id: int
    is_safe: bool
    safety_level: DocumentSafetyEnum
    confidence: float = Field(ge=0, le=1)
    toxicity_score: float = Field(ge=0, le=1)
    nsfw_score: Optional[float] = Field(None, ge=0, le=1)
    reason: str
    action: str  # "approve", "reject", "review"
    analysis_timestamp: datetime
    detected_terms: list[str] = []       # flagged words/phrases found
    language_detected: str = "unknown"   # "ar", "fr", "en", "mixed", "unknown"
    requires_human_review: bool = False  # True when action="review"
    toxicity_level: str = "none"         # "none", "low", "medium", "high"
    toxicity_type: str = "none"          # "none", "insult", "harassment", "hate", "profanity"
    model_version: str = "1.0.0"


class ContentTypeEnum(str, Enum):
    TEXT = "text"
    PDF = "pdf"
    IMAGE = "image"
    MIXED = "mixed"


# ═══════════════════════════════════════════════════════════════
# Reclamation Analysis Models
# ═══════════════════════════════════════════════════════════════
class ReclamationCluster(BaseModel):
    cluster_id: int
    topic: str
    count: int
    priority: str  # "basse", "moyenne", "urgente"
    sample_reclamations: List[str]


class ReclamationInsights(BaseModel):
    total_reclamations: int
    clustered_count: int
    unique_topics: int
    top_clusters: List[ReclamationCluster]
    trending_topics: List[str]
    priority_distribution: dict


class ReclamationAnalysisResponse(BaseModel):
    insights: ReclamationInsights
    timestamp: datetime
    analysis_period: str


# ═══════════════════════════════════════════════════════════════
# Analytics Models
# ═══════════════════════════════════════════════════════════════
class ModuleAnalytics(BaseModel):
    module_id: int
    module_name: str
    reclamation_count: int
    avg_severity: float


class DocumentStatistics(BaseModel):
    total_analyzed: int
    approved: int
    rejected: int
    review_required: int
    rejection_rate: float


class DashboardMetrics(BaseModel):
    total_students: int
    total_reclamations: int
    avg_reclamation_resolution_time: int
    document_rejection_rate: float
    most_problematic_modules: List[ModuleAnalytics]
    document_stats: DocumentStatistics
    reclamation_trends: dict


class DashboardResponse(BaseModel):
    metrics: DashboardMetrics
    generated_at: datetime
    period: str


# ═══════════════════════════════════════════════════════════════
# Audit Log Models
# ═══════════════════════════════════════════════════════════════
class AuditLogEntry(BaseModel):
    user_id: int
    role: str
    endpoint: str
    method: str
    input_summary: str
    output_summary: str
    status: str  # "success", "error"
    error_message: Optional[str] = None
    timestamp: datetime
    duration_ms: float


# ═══════════════════════════════════════════════════════════════
# Error Response Models
# ═══════════════════════════════════════════════════════════════
class ErrorDetail(BaseModel):
    code: str
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
    timestamp: datetime


# ═══════════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════════
class HealthCheckResponse(BaseModel):
    status: str
    version: str
    database: str
    models_loaded: bool
    timestamp: datetime

# ═══════════════════════════════════════════════════════════════
# Image Moderation
# ═══════════════════════════════════════════════════════════════
class ImageModerationResponse(BaseModel):
    is_toxic: bool
    is_visual_toxic: bool
    is_text_toxic: bool
    extracted_text: str
    confidence_score: float
    requires_human_review: bool
    toxicity_level: Optional[str] = None
    toxicity_type: Optional[str] = None
    language_detected: Optional[str] = None
    model_version: Optional[str] = None
