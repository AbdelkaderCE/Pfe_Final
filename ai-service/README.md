# AI Microservice — Execution & Setup Guide

## 🎯 1. Project Overview

The **AI Microservice** is a production-grade Python backend for a University Management System. It provides enterprise-level AI capabilities for content moderation, text analytics, and document safety verification.

**Key Features:**
- **Hybrid Multilingual Moderation:** AI + Rule-based toxicity detection for Arabic (MSA + Algerian dialect), French, English, and mixed-language inputs.
- **Multimodal Image Moderation:** OCR text extraction + visual NSFW/violence detection via deep learning.
- **NLP Document Analysis:** Categorization, sentiment analysis, and harmful content detection for academic documents.
- **Data Analytics & Clustering:** Advanced K-Means clustering for reclamation pattern analysis.
- **Document Processing:** PDF and DOCX text extraction for moderation.
- **Security:** JWT authentication, Role-Based Access Control (RBAC), and full audit logging.
- **Enterprise Hardening:** Rate limiting, input validation, result caching, structured observability logging, and configurable thresholds.

---

## 🛠️ 2. Tech Stack

| Category | Technology |
|----------|-----------|
| Language | Python 3.10+ |
| Framework | FastAPI |
| Web Server | Uvicorn |
| AI/ML | PyTorch, Transformers (HuggingFace), Sentence-Transformers, Scikit-Learn, NLTK |
| OCR | EasyOCR (Arabic, French, English) |
| Vector Search | FAISS |
| Database / ORM | PostgreSQL / SQLAlchemy |
| Document Processing | pdfminer.six, python-docx |
| Security | PyJWT, Passlib (bcrypt) |
| Observability | python-json-logger (structured JSON logs) |

---

## 📂 3. Project Structure

```text
ai-service/
├── app/
│   ├── api/v1/endpoints/   # FastAPI routers (health, documents, reclamations, analytics, images)
│   ├── core/               # Configuration (config.py) and database connection (database.py)
│   ├── evaluation/         # Multilingual test dataset and evaluation script
│   ├── models/             # SQLAlchemy DB models and Pydantic request/response schemas
│   ├── pipelines/          # AI/ML logic (moderation, vision, NLP, embeddings, clustering, document processing)
│   ├── security/           # JWT auth, RBAC, audit logging middleware, rate limiting
│   ├── services/           # Business logic layer (document moderation, image moderation, analytics)
│   └── utils/              # Shared utilities (structured logger, TTL cache)
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
└── .gitignore
```

---

## 🚀 4. Installation Steps

### Prerequisites
- Python 3.10 or higher
- PostgreSQL (optional — service starts gracefully without it)

### Step-by-step Setup

```bash
cd ai-service

# Create and activate a virtual environment
python -m venv venv
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## ⚙️ 5. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Application
ENVIRONMENT=development
APP_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pfe_db

# Security
JWT_SECRET_KEY=your-super-secret-key-change-in-production

# Toxicity Thresholds (tunable)
TOXICITY_THRESHOLD=0.5
HIGH_TOXICITY_THRESHOLD=0.9

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

# Input Validation
MAX_TEXT_LENGTH=5000
MAX_IMAGE_SIZE_MB=10

# Caching
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=1000

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
AUDIT_ENABLED=True
```

---

## ▶️ 6. Run the Service

```bash
uvicorn main:app --reload --port 5001
```

- **Default URL:** `http://localhost:5001`
- **Swagger Interactive Docs:** `http://localhost:5001/docs`
- **ReDoc Documentation:** `http://localhost:5001/redoc`

---

## 🌐 7. API Endpoints Overview

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | `GET` | API root with version and docs links |
| `/health` | `GET` | System health check (DB, memory, AI pipeline status) |
| `/api/v1/documents/analyze` | `POST` | Moderate documents for toxicity, harmful content, NSFW |
| `/api/v1/reclamations` | `POST` | Analyze complaints (sentiment, category, urgency) |
| `/api/v1/analytics` | `POST` | Cluster and analyze bulk data for administrative insights |
| `/api/v1/images/moderate` | `POST` | Moderate images (visual toxicity + OCR text moderation) |

---

## 🧪 8. Testing the API

### Option A: Swagger UI
Navigate to `http://localhost:5001/docs` and test endpoints interactively.

### Option B: Using cURL

**Health Check:**
```bash
curl -X GET http://localhost:5001/health
```

**Document Moderation:**
```bash
curl -X POST http://localhost:5001/api/v1/documents/analyze \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <JWT_TOKEN>" \
-d '{
  "document_id": 1,
  "content_type": "text",
  "text_content": "This is a test document for moderation."
}'
```

**Image Moderation:**
```bash
curl -X POST http://localhost:5001/api/v1/images/moderate \
  -F "file=@/path/to/your/image.jpg"
```

### Option C: Run Evaluation Script
```bash
python -m app.evaluation.evaluate
```

---

## 🚢 9. Deployment Notes

### Production Command
```bash
uvicorn main:app --host 0.0.0.0 --port 5001 --workers 4
```

### Key Considerations
- Set `ENVIRONMENT=production`, `DEBUG=False`, and generate a strong `JWT_SECRET_KEY`.
- AI models are loaded lazily as singletons. Each worker loads its own copy — ensure adequate RAM (≥2 GB per worker).
- Rate limiting is per-worker in the default in-memory mode. For multi-instance deployments, consider a shared Redis-backed limiter.
- Tune `TOXICITY_THRESHOLD` and `HIGH_TOXICITY_THRESHOLD` via `.env` without code changes.

---

## 🆘 10. Troubleshooting

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError` | Activate venv and re-run `pip install -r requirements.txt` |
| `psycopg2.OperationalError` | Verify `DATABASE_URL` credentials |
| `Address already in use` | Port conflict — use `--port 8080` |
| `HTTP 429 Too Many Requests` | Rate limit exceeded — wait and retry |
| `HTTP 413 Payload Too Large` | Image exceeds `MAX_IMAGE_SIZE_MB` — reduce file size |
| `Out of Memory (OOM)` | Reduce `--workers` or use lighter models |
