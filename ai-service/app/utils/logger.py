"""
Logger configuration and utility functions
JSON structured logging with required fields:
timestamp, level, logger, message, user_id, endpoint, duration_ms, error_trace
"""
import logging
import sys
from pythonjsonlogger import jsonlogger
from app.core.config import settings


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter that adds required fields."""

    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record["timestamp"] = log_record.get("timestamp", self.formatTime(record))
        log_record["level"] = record.levelname
        log_record["logger"] = record.name
        # These fields will be populated when available
        log_record.setdefault("user_id", None)
        log_record.setdefault("endpoint", None)
        log_record.setdefault("duration_ms", None)
        log_record.setdefault("error_trace", None)

    def formatTime(self, record, datefmt=None):
        from datetime import datetime, timezone
        ct = datetime.fromtimestamp(record.created, tz=timezone.utc)
        return ct.isoformat()


def setup_logger(name: str) -> logging.Logger:
    """
    Configure JSON logger for structured logging
    """
    _logger = logging.getLogger(name)
    _logger.setLevel(getattr(logging, settings.log_level))

    # Avoid duplicate handlers
    if _logger.handlers:
        return _logger

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)

    if settings.log_format == "json":
        formatter = CustomJsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s'
        )
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    console_handler.setFormatter(formatter)
    _logger.addHandler(console_handler)

    return _logger


# Global logger
logger = setup_logger("ai-service")
get_logger = setup_logger
