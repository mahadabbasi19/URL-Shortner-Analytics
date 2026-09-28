import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_user_optional
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.user import User
from app.repositories.url_repository import URLRepository
from app.schemas.url import URLCreate, URLCreateResponse, URLResponse
from app.services.shortener_service import ShortenerService

router = APIRouter(prefix="/api/v1/urls", tags=["URLs"])


@router.post("", response_model=URLCreateResponse, status_code=status.HTTP_201_CREATED)
def create_url(
    payload: URLCreate,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User | None = Depends(get_current_user_optional),
) -> URLCreateResponse:
    """Create a short URL. Works anonymously (matches Bitly's own product —
    auth is additive, not required to shorten a link) or, with a valid
    bearer token, attributes the link to the authenticated user so it shows
    up in their "my URLs" list and their analytics are access-controlled.
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
    url = URLRepository(db).get_by_id(url_id)
    if url is None:
        raise NotFoundError("URL not found.")
    if url.user_id != current_user.id:
        raise ForbiddenError("You do not have access to this URL.")
    return URLResponse.model_validate(url)
