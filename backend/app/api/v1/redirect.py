import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from fastapi.responses import RedirectResponse
from redis import Redis
from sqlalchemy.orm import Session
from starlette import status

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.exceptions import GoneError
from app.core.redis_client import get_redis
from app.middleware.rate_limit import rate_limit_by_ip
from app.repositories.url_repository import URLRepository
from app.services.cache_service import CacheService
from app.services.click_recording_service import record_click
from app.services.shortener_service import ShortenerService
from app.utils.link_status import is_link_usable

logger = logging.getLogger("app.redirect")

router = APIRouter(tags=["Redirect"])


def _schedule_click_recording(background_tasks: BackgroundTasks, request: Request, url_id: uuid.UUID) -> None:
    # request.client is None in some ASGI test/proxy setups; guard rather
    # than let a background task crash on a missing attribute.
    ip = request.client.host if request.client else None
    background_tasks.add_task(
        record_click,
        url_id=url_id,
        ip=ip,
        user_agent=request.headers.get("user-agent"),
        referrer=request.headers.get("referer"),
    )


@router.get("/{short_code}", dependencies=[Depends(rate_limit_by_ip("rate_limit_redirect"))])
def redirect_to_original(
    short_code: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    redis_client: Redis = Depends(get_redis),
) -> RedirectResponse:
    """The hot path, cache-aside in front of Postgres:

        Redis GET -> HIT: validate cached payload -> redirect
                  -> MISS: Postgres SELECT -> validate -> Redis SETEX -> redirect

    CacheService never raises on a Redis problem, so a Redis outage silently
    degrades this endpoint to Postgres-only rather than breaking redirects.
    Only *usable* links are cached — resolve_for_redirect raises before we
    ever reach cache.set(), so expired/disabled links are never cached.

    Click analytics are scheduled as a BackgroundTask: it runs after this
    response has already been sent, so referrer/UA/geo parsing never adds
    latency to the redirect itself (see click_recording_service.record_click).
    total_clicks, by contrast, is incremented synchronously — it's a single
    indexed-PK update and the one figure a URL's own detail view needs
    immediately, so it doesn't need to wait on the background pipeline.

    HTTP 302 (Found), not 301: see README "Request Lifecycle" for why a
    short link must never be permanently cached by the browser.
    """
    cache = CacheService(redis_client, settings)
    repo = URLRepository(db)

    cached = cache.get(short_code)
    if cached is not None:
        expires_at = datetime.fromisoformat(cached["expires_at"]) if cached["expires_at"] else None
        if not is_link_usable(cached["is_active"], expires_at):
            raise GoneError("This link has expired or been disabled.")

        url_id = uuid.UUID(cached["id"])
        repo.increment_clicks(url_id)
        db.commit()
        _schedule_click_recording(background_tasks, request, url_id)
        return RedirectResponse(url=cached["original_url"], status_code=status.HTTP_302_FOUND)

    service = ShortenerService(db, settings)
    url = service.resolve_for_redirect(short_code)

    cache.set(url)
    repo.increment_clicks(url.id)
    db.commit()
    _schedule_click_recording(background_tasks, request, url.id)

    return RedirectResponse(url=url.original_url, status_code=status.HTTP_302_FOUND)
