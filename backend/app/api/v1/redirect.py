import logging

from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from starlette import status

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.services.shortener_service import ShortenerService

logger = logging.getLogger("app.redirect")

router = APIRouter(tags=["Redirect"])


@router.get("/{short_code}")
def redirect_to_original(
    short_code: str,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    """The hot path. Currently Postgres-only; Phase 3 adds a Redis
    cache-aside layer in front of this lookup.

    HTTP 302 (Found) is used rather than 301 (Moved Permanently): a short
    link's destination can change, be disabled, or expire, and every click
    must still reach our server so it can be counted — a 301 would let
    browsers cache the redirect indefinitely and silently skip us (and our
    analytics) on repeat visits. 302 keeps every visit live while still
    being a standard, widely-cached-appropriately redirect for GET requests.
    """
    service = ShortenerService(db, settings)
    url = service.resolve_for_redirect(short_code)

    service.repo.increment_clicks(url.id)
    db.commit()

    return RedirectResponse(url=url.original_url, status_code=status.HTTP_302_FOUND)
