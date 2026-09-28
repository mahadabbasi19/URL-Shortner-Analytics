from typing import Callable

from fastapi import Depends, Request
from redis import Redis

from app.core.config import Settings, get_settings
from app.core.deps import get_current_user_optional
from app.core.exceptions import RateLimitError
from app.core.redis_client import get_redis
from app.models.user import User
from app.services.rate_limit_service import RateLimiter
from app.utils.rate_spec import parse_rate


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def rate_limit_by_ip(settings_attr: str) -> Callable:
    """Factory for a simple per-IP rate-limit dependency, scoped by a
    Settings attribute name (e.g. "rate_limit_auth_login"). Used on
    endpoints where the caller's identity isn't otherwise part of the
    request handling (login, redirect, public analytics reads).
    """

    def dependency(
        request: Request,
        redis_client: Redis = Depends(get_redis),
        settings: Settings = Depends(get_settings),
    ) -> None:
        limit, window = parse_rate(getattr(settings, settings_attr))
        key = f"{settings_attr}:{_client_ip(request)}"
        allowed, retry_after = RateLimiter(redis_client).check(key, limit, window)
        if not allowed:
            raise RateLimitError("Rate limit exceeded. Please try again later.", retry_after=retry_after)

    return dependency


def rate_limit_create(
    request: Request,
    current_user: User | None = Depends(get_current_user_optional),
    redis_client: Redis = Depends(get_redis),
    settings: Settings = Depends(get_settings),
) -> User | None:
    """URL creation gets a *different* limit for anonymous vs. authenticated
    callers (anonymous callers are the likelier abuse vector, so they get
    the tighter limit) — combined with auth resolution so the route handler
    still gets `current_user` from a single dependency, rather than
    resolving auth twice.
    """
    if current_user is not None:
        limit, window = parse_rate(settings.rate_limit_auth_create)
        identifier = f"user:{current_user.id}"
    else:
        limit, window = parse_rate(settings.rate_limit_anon_create)
        identifier = f"ip:{_client_ip(request)}"

    allowed, retry_after = RateLimiter(redis_client).check(f"create:{identifier}", limit, window)
    if not allowed:
        raise RateLimitError("Too many URLs created. Please try again later.", retry_after=retry_after)
    return current_user
