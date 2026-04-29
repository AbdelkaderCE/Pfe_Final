"""
Sliding-window per-IP rate limiter.
Default: 100 requests per minute per IP.
Configurable via settings.rate_limit_per_minute.
Returns 429 with retry_after_seconds when exceeded.
"""
from collections import defaultdict, deque
from datetime import datetime, timedelta
from fastapi import Request, HTTPException
from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

class RateLimiter:
    """Thread-safe sliding window rate limiter."""
    
    def __init__(self):
        self._requests: dict = defaultdict(deque)
    
    def is_allowed(self, ip: str) -> tuple[bool, int]:
        """
        Check if IP is within rate limit.
        Returns (allowed: bool, retry_after_seconds: int)
        """
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=1)
        window = self._requests[ip]
        
        # Remove requests outside the 1-minute window
        while window and window[0] < window_start:
            window.popleft()
        
        limit = getattr(settings, 'rate_limit_per_minute', 100)
        
        if len(window) >= limit:
            oldest = window[0]
            retry_after = int((oldest + timedelta(minutes=1) - now).total_seconds()) + 1
            return False, max(retry_after, 1)
        
        window.append(now)
        return True, 0

# Global singleton
_limiter = RateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    """FastAPI middleware for rate limiting."""
    # Skip rate limiting for health endpoint
    if request.url.path == "/health":
        return await call_next(request)
    
    ip = request.client.host if request.client else "unknown"
    allowed, retry_after = _limiter.is_allowed(ip)
    
    if not allowed:
        logger.warning(f"Rate limit exceeded for IP: {ip}")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "retry_after_seconds": retry_after,
                "limit": "100 requests per minute"
            }
        )
    
    return await call_next(request)
