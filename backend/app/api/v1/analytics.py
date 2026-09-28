import uuid
from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.repositories.url_repository import URLRepository
from app.schemas.analytics import URLAnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1/urls", tags=["Analytics"])


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
) -> URLAnalyticsResponse:
    """Aggregated click analytics for one URL. Not yet ownership-restricted
    — any URL id returns its analytics. Phase 5 (auth) will require the
    requester to own the URL, matching the README's documented plan.
    """
    repo = URLRepository(db)
    url = repo.get_by_id(url_id)
    if url is None:
        raise NotFoundError("URL not found.")

    start, end = _to_range_bounds(start_date, end_date)
    return AnalyticsService(db).get_summary(url_id, start, end)
