import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from redis import Redis
from sqlalchemy.orm import Session
from starlette import status

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.exceptions import GoneError
from app.core.redis_client import get_redis
from app.repositories.url_repository import URLRepository
from app.services.cache_service import CacheService
from app.services.shortener_service import ShortenerService
from app.utils.link_status import is_link_usable

logger = logging.getLogger("app.redirect")

router = APIRouter(tags=["Redirect"])


@router.get("/{short_code}")
def redirect_to_original(
    short_code: str,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    redis_client: Redis = Depends(get_redis),
) -> RedirectResponse:
    """The hot path, now cache-aside:

        Redis GET -> HIT: validate cached payload -> redirect
                  -> MISS: Postgres SELECT -> validate -> Redis SETEX -> redirect

    CacheService never raises on a Redis problem, so a Redis outage silently
    degrades this endpoint to Postgres-only rather than breaking redirects.
    Only *usable* links are cached — resolve_for_redirect raises before we
    ever reach cache.set(), so expired/disabled links are never cached in
    the first place.

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

        repo.increment_clicks(uuid.UUID(cached["id"]))
        db.commit()
        return RedirectResponse(url=cached["original_url"], status_code=status.HTTP_302_FOUND)

    service = ShortenerService(db, settings)
    url = service.resolve_for_redirect(short_code)

    cache.set(url)
    repo.increment_clicks(url.id)
    db.commit()

    return RedirectResponse(url=url.original_url, status_code=status.HTTP_302_FOUND)
