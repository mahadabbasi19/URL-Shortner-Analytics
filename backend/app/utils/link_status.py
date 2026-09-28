from datetime import datetime, timezone


def is_link_usable(is_active: bool, expires_at: datetime | None, now: datetime | None = None) -> bool:
    """Single source of truth for "is this link still valid", shared by the
    Postgres path (URLRepository) and the Redis cache path (CacheService) so
    a cached entry and a freshly-queried row are judged by the same rule.
    """
    if not is_active:
        return False
    if expires_at is None:
        return True
    now = now or datetime.now(timezone.utc)
    return expires_at > now
