import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from redis import Redis
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.redis_client import get_redis
from app.middleware.rate_limit import rate_limit_create
from app.models.user import User
from app.repositories.url_repository import URLRepository
from app.schemas.url import URLCreate, URLCreateResponse, URLResponse, URLUpdate
from app.services.cache_service import CacheService
from app.services.qr_service import generate_qr_png
from app.services.shortener_service import ShortenerService

router = APIRouter(prefix="/api/v1/urls", tags=["URLs"])


def _get_owned_url(db: Session, url_id: uuid.UUID, current_user: User):
    url = URLRepository(db).get_by_id(url_id)
    if url is None:
        raise NotFoundError("URL not found.")
    if url.user_id != current_user.id:
        raise ForbiddenError("You do not have access to this URL.")
    return url


@router.post("", response_model=URLCreateResponse, status_code=status.HTTP_201_CREATED)
def create_url(
    payload: URLCreate,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User | None = Depends(rate_limit_create),
) -> URLCreateResponse:
    """Create a short URL. Works anonymously (matches Bitly's own product —
    auth is additive, not required to shorten a link) or, with a valid
    bearer token, attributes the link to the authenticated user so it shows
    up in their "my URLs" list and their analytics are access-controlled.
    Rate-limited differently for anonymous vs. authenticated callers — see
    middleware/rate_limit.py.
    """
    service = ShortenerService(db, settings)
    url = service.create_url(payload, user_id=current_user.id if current_user else None)
    db.commit()
    db.refresh(url)

    base = URLResponse.model_validate(url)
    return URLCreateResponse(**base.model_dump(), short_url=f"{settings.base_url}/{url.short_code}")


@router.get("", response_model=list[URLResponse])
def list_my_urls(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=50, le=100, ge=1),
    offset: int = Query(default=0, ge=0),
) -> list[URLResponse]:
    """Requires auth — there is no "my URLs" without a "me". Anonymously
    created links have no owner and are intentionally not listable here.
    """
    urls = URLRepository(db).list_for_user(current_user.id, limit=limit, offset=offset)
    return [URLResponse.model_validate(u) for u in urls]


@router.get("/{url_id}", response_model=URLResponse)
def get_url(
    url_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> URLResponse:
    url = _get_owned_url(db, url_id, current_user)
    return URLResponse.model_validate(url)


@router.patch("/{url_id}", response_model=URLResponse)
def update_url(
    url_id: uuid.UUID,
    payload: URLUpdate,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
) -> URLResponse:
    """Partial update — only fields actually present in the request body are
    applied (`exclude_unset`), so omitting `is_active` never accidentally
    re-enables a disabled link. Any change invalidates the Redis cache entry
    immediately: this is what closes the "stale cache" window described in
    the README's Redis Caching section, rather than waiting out the TTL.
    """
    url = _get_owned_url(db, url_id, current_user)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(url, field, value)

    db.commit()
    db.refresh(url)

    if updates:
        CacheService(redis_client, settings).invalidate(url.short_code)

    return URLResponse.model_validate(url)


@router.delete("/{url_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_url(
    url_id: uuid.UUID,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
) -> Response:
    url = _get_owned_url(db, url_id, current_user)
    short_code = url.short_code

    URLRepository(db).delete(url)
    db.commit()
    CacheService(redis_client, settings).invalidate(short_code)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{url_id}/qr", response_class=Response)
def get_url_qr_code(
    url_id: uuid.UUID,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(get_current_user),
) -> Response:
    """PNG QR code encoding the link's short URL. Generated on demand rather
    than precomputed at create time — QR generation is cheap and most links
    are never viewed as a QR code, so precomputing would waste work on
    every single create for a feature most links never use.
    """
    url = _get_owned_url(db, url_id, current_user)
    short_url = f"{settings.base_url}/{url.short_code}"
    png_bytes = generate_qr_png(short_url)
    return Response(content=png_bytes, media_type="image/png")
