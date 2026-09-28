import logging

from redis import Redis, RedisError

logger = logging.getLogger("app.ratelimit")


class RateLimiter:
    """Fixed-window rate limiting backed by Redis INCR + EXPIRE. State lives
    in shared Redis rather than process memory, so the limit holds correctly
    across multiple backend instances behind a load balancer.

    Algorithm: fixed window (INCR a counter keyed by identifier+scope; set
    its TTL to the window length on the first hit; reject once the count
    exceeds the limit, with Retry-After = the key's remaining TTL). This is
    simple and cheap — one INCR, and one EXPIRE only on the window's first
    request — but it has a known edge case: a burst right at the end of one
    window plus a burst right at the start of the next can let roughly 2x
    the nominal limit through in a short span. A sliding-window-log (store
    each request's timestamp in a sorted set, count entries within the
    trailing window) or token-bucket (continuous refill, allows controlled
    bursts) algorithm avoids that, at the cost of more Redis state per key
    and more computation per check. For anti-abuse limits at this project's
    scale, bounding worst-case abuse to ~2x the stated limit is an
    acceptable trade for the much simpler, cheaper implementation.

    Fails open: any RedisError during a check allows the request through
    rather than rejecting it — an outage in the rate limiter must not
    become an outage of the product itself.
    """

    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    def check(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        """Returns (allowed, retry_after_seconds). retry_after is 0 when allowed."""
        full_key = f"ratelimit:{key}"
        try:
            count = self.redis.incr(full_key)
            if count == 1:
                self.redis.expire(full_key, window_seconds)
            if count > limit:
                ttl = self.redis.ttl(full_key)
                return False, max(ttl, 1)
            return True, 0
        except RedisError:
            logger.warning("Redis rate-limit check failed for key=%s; failing open", key)
            return True, 0
