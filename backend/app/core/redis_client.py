import logging

import redis

from app.core.config import get_settings

logger = logging.getLogger("app.redis")
settings = get_settings()

# A single shared connection pool for the process. socket_connect_timeout/
# socket_timeout are kept short so a dead Redis fails fast instead of
# hanging the redirect path — callers are expected to catch RedisError
# and fall back to Postgres (see services/cache_service.py).
redis_pool = redis.ConnectionPool.from_url(
    settings.redis_url,
    socket_connect_timeout=1,
    socket_timeout=1,
    decode_responses=True,
)


def get_redis() -> redis.Redis:
    return redis.Redis(connection_pool=redis_pool)
