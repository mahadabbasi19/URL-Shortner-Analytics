from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.schemas.url import URLCreate, URLCreateResponse, URLResponse
from app.services.shortener_service import ShortenerService

router = APIRouter(prefix="/api/v1/urls", tags=["URLs"])


@router.post("", response_model=URLCreateResponse, status_code=status.HTTP_201_CREATED)
def create_url(
    payload: URLCreate,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> URLCreateResponse:
    """Create a short URL. Anonymous for now — Phase 5 adds optional auth so
    logged-in users' links are attributed to their account.
    """
    service = ShortenerService(db, settings)
    url = service.create_url(payload, user_id=None)
    db.commit()
    db.refresh(url)

    base = URLResponse.model_validate(url)
    return URLCreateResponse(**base.model_dump(), short_url=f"{settings.base_url}/{url.short_code}")
