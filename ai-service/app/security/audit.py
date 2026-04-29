"""
Audit logging middleware
Logs all AI actions for compliance and debugging
Uses hashed input summaries — no raw sensitive data stored
"""
import time
import hashlib
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.logger import logger
from app.models.db_models import AiAuditLog
from app.core.database import SessionLocal


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all API calls to audit table
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Log request/response to audit database
        """
        start_time = time.time()

        # Extract user info if available
        user_id = None
        role = None
        auth_header = request.headers.get("Authorization")

        if auth_header:
            try:
                from app.security.auth import extract_token_from_header, verify_token
                token = extract_token_from_header(auth_header)
                payload = verify_token(token)
                user_id = payload["user_id"]
                role = payload["roles"][0] if payload["roles"] else "unknown"
            except Exception as e:
                logger.debug(f"Could not extract user info: {e}")

        # Get request body summary (hashed for privacy)
        input_summary = f"{request.method} {request.url.path}"
        if request.method in ["POST", "PUT"]:
            try:
                body = await request.body()
                body_hash = hashlib.sha256(body).hexdigest()[:16]
                input_summary += f" hash={body_hash} size={len(body)}B"
            except Exception as e:
                logger.debug(f"Could not read request body: {e}")

        # Call next middleware/endpoint
        try:
            response = await call_next(request)
            status_code = response.status_code
            status_str = "success" if 200 <= status_code < 300 else "error"
            error_message = None
        except Exception as e:
            logger.error(f"Request failed: {e}")
            status_str = "error"
            error_message = str(e)
            raise

        duration_ms = (time.time() - start_time) * 1000

        # Structured audit log to stdout
        logger.info(
            "Audit log entry",
            extra={
                "event": "audit_log",
                "user_id": user_id,
                "endpoint": str(request.url.path),
                "method": request.method,
                "status": status_str,
                "duration_ms": round(duration_ms, 2),
            },
        )

        # Log to database
        if user_id:
            try:
                db = SessionLocal()
                audit_log = AiAuditLog(
                    user_id=user_id,
                    role=role or "unknown",
                    endpoint=str(request.url.path),
                    method=request.method,
                    input_summary=input_summary[:255],
                    output_summary=f"Status: {status_code}" if not error_message else error_message[
                        :255],
                    status=status_str,
                    error_message=error_message,
                    duration_ms=duration_ms,
                )
                db.add(audit_log)
                db.commit()
                db.close()
            except Exception as e:
                logger.error(f"Failed to write audit log: {e}")

        return response
