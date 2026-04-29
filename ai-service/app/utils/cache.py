"""
Thread-safe TTL cache with max-size eviction.
Used to cache moderation results by SHA-256 hash of input.
Prevents reprocessing identical documents.
"""
import hashlib
import threading
from collections import OrderedDict
from datetime import datetime, timedelta
from typing import Any, Optional
from app.utils.logger import get_logger

logger = get_logger(__name__)

class TTLCache:
    """
    Thread-safe LRU cache with TTL expiry.
    Max size: 1000 entries (configurable)
    TTL: 300 seconds (5 minutes, configurable)
    """
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 300):
        self._cache: OrderedDict = OrderedDict()
        self._lock = threading.Lock()
        self._max_size = max_size
        self._ttl = timedelta(seconds=ttl_seconds)
    
    def _make_key(self, text: str) -> str:
        """Create SHA-256 hash key from input text."""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()
    
    def get(self, text: str) -> Optional[Any]:
        """Get cached result for text. Returns None if not found or expired."""
        key = self._make_key(text)
        with self._lock:
            if key not in self._cache:
                return None
            value, expiry = self._cache[key]
            if datetime.utcnow() > expiry:
                del self._cache[key]
                return None
            # Move to end (LRU)
            self._cache.move_to_end(key)
            logger.debug(f"Cache HIT for key: {key[:16]}...")
            return value
    
    def set(self, text: str, value: Any) -> None:
        """Store result in cache with TTL."""
        key = self._make_key(text)
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = (value, datetime.utcnow() + self._ttl)
            # Evict oldest if over max size
            while len(self._cache) > self._max_size:
                self._cache.popitem(last=False)
    
    def clear(self) -> None:
        """Clear all cache entries."""
        with self._lock:
            self._cache.clear()
    
    def stats(self) -> dict:
        """Return cache statistics."""
        with self._lock:
            return {
                "size": len(self._cache),
                "max_size": self._max_size,
                "ttl_seconds": int(self._ttl.total_seconds())
            }

# Global singleton for moderation results
moderation_cache = TTLCache(max_size=1000, ttl_seconds=300)
