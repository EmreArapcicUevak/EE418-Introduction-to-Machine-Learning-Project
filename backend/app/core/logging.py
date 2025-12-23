import json
import logging
import os
from datetime import datetime
from typing import Any, Dict


class JsonFormatter(logging.Formatter):
    """Structured JSON logs for better auditability and parsing."""

    def __init__(self):
        super().__init__()
        self._standard_keys = {
            "name",
            "msg",
            "args",
            "levelname",
            "levelno",
            "pathname",
            "filename",
            "module",
            "exc_info",
            "exc_text",
            "stack_info",
            "lineno",
            "funcName",
            "created",
            "msecs",
            "relativeCreated",
            "thread",
            "threadName",
            "processName",
            "process",
        }

    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            "ts": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Extras added via logger.*(..., extra={...})
        extras = {
            k: v for k, v in record.__dict__.items() if k not in self._standard_keys
        }
        if extras:
            payload["context"] = extras

        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False)


def configure_logging() -> logging.Logger:
    json_logging = os.getenv("LOG_JSON", "true").lower() in {"1", "true", "yes"}
    level = os.getenv("LOG_LEVEL", "INFO").upper()

    if json_logging:
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        logging.basicConfig(level=level, handlers=[handler], force=True)
    else:
        logging.basicConfig(
            level=level,
            format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            force=True,
        )

    return logging.getLogger("price-api")


logger = configure_logging()
