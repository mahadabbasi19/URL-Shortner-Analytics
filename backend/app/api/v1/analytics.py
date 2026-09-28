import uuid
from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user_optional
from app.core.exceptions import ForbiddenError, NotFoundError
from app.middleware.rate_limit import rate_limit_by_ip
from app.models.user import User
from app.repositories.url_repository import URLRepository
from app.schemas.analytics import URLAnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(
    prefix="/api/v1/urls",
    tags=["Analytics"],
    dependencies=[Depends(rate_limit_by_ip("rate_limit_analytics"))],
)


def _to_range_bounds(start_date: date | None, end_date: date | None) -> tuple[datetime | None, datetime | None]:
    start = datetime.combine(start_date, time.min, tzinfo=timezone.utc) if start_date else None
    end = datetime.combine(end_date, time.max, tzinfo=timezone.utc) if end_date else None
    return start, end


@router.get("/{url_id}/analytics", response_model=URLAnalyticsResponse)
def get_url_analytics(
    url_id: uuid.UUID,
    start_date: date | None = Query(default=None, description="Inclusive, UTC"),
    end_date: date | None = Query(default=None, description="Inclusive, UTC"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> URLAnalyticsResponse:
    """Aggregated click analytics for one URL.

    Ownership rule: a URL created anonymously (`user_id IS NULL`) has no
    owner to restrict access to, so its analytics stay publicly readable by
    short_code-holders — matching how it could be created in the first
    place. A URL created by an authenticated user is private to that user;
    anyone else (including an anonymous caller) gets 403.
    """
    repo = URLRepository(db)
    url = repo.get_by_id(url_id)
    if url is None:
        raise NotFoundError("URL not found.")

    if url.user_id is not None and (current_user is None or current_user.id != url.user_id):
        raise ForbiddenError("You do not have access to this URL's analytics.")

    start, end = _to_range_bounds(start_date, end_date)
    return AnalyticsService(db).get_summary(url_id, start, end)
