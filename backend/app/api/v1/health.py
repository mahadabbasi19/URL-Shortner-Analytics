import logging

from fastapi import APIRouter, Depends
from redis import Redis, RedisError
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.redis_client import get_redis

logger = logging.getLogger("app.health")

router = APIRouter(tags=["System"])


@router.get("/health")
def health(db: Session = Depends(get_db), redis_client: Redis = Depends(get_redis)) -> dict:
    """Liveness/readiness probe. Reports each dependency separately so an
    operator (or Docker healthcheck) can tell *which* backing service is
    down, without leaking connection strings or stack traces.
    """
    postgres_ok = True
    redis_ok = True

    try:
        db.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Health check: PostgreSQL unreachable")
        postgres_ok = False

    try:
        redis_client.ping()
    except RedisError:
        logger.exception("Health check: Redis unreachable")
        redis_ok = False

    status = "ok" if postgres_ok and redis_ok else "degraded"
    return {
        "status": status,
        "postgres": "ok" if postgres_ok else "unavailable",
        "redis": "ok" if redis_ok else "unavailable",
    }
