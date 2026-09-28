import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.click_event import ClickEvent
from app.repositories.click_event_repository import ClickEventRepository
from app.schemas.analytics import ClicksOverTimePoint, NamedCount, URLAnalyticsResponse

_TOP_N = 5


class AnalyticsService:
    def __init__(self, db: Session):
        self.repo = ClickEventRepository(db)

    def get_summary(
        self, url_id: uuid.UUID, start: datetime | None, end: datetime | None
    ) -> URLAnalyticsResponse:
        def top(column, limit: int = _TOP_N) -> list[NamedCount]:
            rows = self.repo.top_values(url_id, column, start, end, limit=limit)
            return [NamedCount(name=name, count=count) for name, count in rows]

        clicks_over_time = [
            ClicksOverTimePoint(date=day, count=count)
            for day, count in self.repo.clicks_over_time(url_id, start, end)
        ]

        return URLAnalyticsResponse(
            total_clicks=self.repo.total_clicks(url_id, start, end),
            unique_visitors=self.repo.unique_visitors(url_id, start, end),
            clicks_today=self.repo.clicks_today(url_id),
            clicks_over_time=clicks_over_time,
            top_countries=top(ClickEvent.country),
            top_cities=top(ClickEvent.city),
            top_referrers=top(ClickEvent.referrer_domain),
            browsers=top(ClickEvent.browser),
            operating_systems=top(ClickEvent.operating_system),
            devices=top(ClickEvent.device_type),
        )
