"""
Environment configuration for AI Microservice
Loads from .env file or environment variables
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ═══════════════════════════════════════════════════════════════
    # Application Settings
    # ═══════════════════════════════════════════════════════════════
    app_name: str = "AI Microservice - University System"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"

    # Server
    host: str = "0.0.0.0"
    port: int = 5001
    api_v1_prefix: str = "/api/v1"

    # ═══════════════════════════════════════════════════════════════
    # Database Configuration
    # ═══════════════════════════════════════════════════════════════
    database_url: str = "postgresql://user:password@localhost:5432/pfe_db"
    db_pool_size: int = 20
    db_max_overflow: int = 10
    db_echo: bool = False

    # ═══════════════════════════════════════════════════════════════
    # JWT & Authentication
    # ═══════════════════════════════════════════════════════════════
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    # ═══════════════════════════════════════════════════════════════
    # AI Model Configuration
    # ═══════════════════════════════════════════════════════════════
    # NLP Model
    nlp_model_name: str = "distilbert-base-multilingual-cased"

    # Embeddings
    embeddings_model: str = "sentence-transformers/multi-qa-MiniLM-L6-cos-v1"
    embeddings_dimension: int = 384

    # FAISS Vector DB
    faiss_index_path: str = "./data/faiss_index"
    faiss_backend: str = "cpu"  # cpu or gpu

    # Clustering
    clustering_algorithm: str = "kmeans"
    clustering_n_clusters: int = 10
    clustering_min_samples: int = 3

    # Toxicity/Safety Detection Threshold
    toxicity_threshold: float = 0.5
    high_toxicity_threshold: float = 0.9
    nsfw_threshold: float = 0.5

    # ═══════════════════════════════════════════════════════════════
    # Rate Limiting
    # ═══════════════════════════════════════════════════════════════
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60
    rate_limit_per_minute: int = 100

    # ═══════════════════════════════════════════════════════════════
    # Input Validation
    # ═══════════════════════════════════════════════════════════════
    max_text_length: int = 5000
    max_image_size_mb: int = 10

    # ═══════════════════════════════════════════════════════════════
    # Caching
    # ═══════════════════════════════════════════════════════════════
    cache_ttl_seconds: int = 300
    cache_max_size: int = 1000

    # ═══════════════════════════════════════════════════════════════
    # Audit & Logging
    # ═══════════════════════════════════════════════════════════════
    log_level: str = "INFO"
    log_format: str = "json"  # json or text
    audit_enabled: bool = True
    audit_table: str = "ai_audit_logs"

    # ═══════════════════════════════════════════════════════════════
    # Security & RBAC
    # ═══════════════════════════════════════════════════════════════
    allowed_roles: list = ["admin", "enseignant", "etudiant"]

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
