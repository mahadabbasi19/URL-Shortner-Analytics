import json
import logging

from redis import Redis, RedisError

from app.core.config import Settings
from app.models.url import URL

logger = logging.getLogger("app.cache")


def _cache_key(short_code: str) -> str:
    return f"url:{short_code}"


class CacheService:
    """Cache-aside layer for the redirect path.

    Every method fails soft: a Redis outage or a malformed cache entry never
    raises past this class — callers (the redirect endpoint) always fall
    back to Postgres. Redis is a speed optimization here, never the system
    of record, so it must never be a new way for the app to go down.
    """

    def __init__(self, redis_client: Redis, settings: Settings):
        self.redis = redis_client
        self.settings = settings

    def get(self, short_code: str) -> dict | None:
        try:
            raw = self.redis.get(_cache_key(short_code))
        except RedisError:
            logger.warning("Redis GET failed for short_code=%s; falling back to Postgres", short_code)
            return None

        if raw is None:
            return None

        try:
            return json.loads(raw)
        except (TypeError, ValueError):
            logger.warning("Corrupt cache entry for short_code=%s; ignoring", short_code)
            return None

    def set(self, url: URL) -> None:
        # Only the fields needed to resolve+validate a redirect — keeps the
        # cached payload small and avoids caching data the redirect path
        # doesn't use (e.g. owner id, title).
        payload = {
            "id": str(url.id),
            "original_url": url.original_url,
            "is_active": url.is_active,
            "expires_at": url.expires_at.isoformat() if url.expires_at else None,
        }
        try:
            self.redis.setex(
                _cache_key(url.short_code),
                self.settings.redirect_cache_ttl_seconds,
                json.dumps(payload),
            )
        except RedisError:
            logger.warning("Redis SETEX failed for short_code=%s; continuing without cache", url.short_code)

    def invalidate(self, short_code: str) -> None:
        """Called whenever a URL's cached fields change — edit, disable,
        delete, or expiration update. Not yet wired to any endpoint (those
        land in Phase 6), but the redirect path already tolerates a stale
        cache within TTL by re-validating is_active/expires_at on every hit.
        """
        try:
            self.redis.delete(_cache_key(short_code))
        except RedisError:
            logger.warning("Redis DELETE failed for short_code=%s", short_code)
