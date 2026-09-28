import uuid
from datetime import datetime, timezone

from sqlalchemy import ColumnElement, Select, func, select
from sqlalchemy.orm import Session

from app.models.click_event import ClickEvent


class ClickEventRepository:
    """All click-analytics SQL lives here. Every aggregate is computed in
    the database (COUNT/GROUP BY/date_trunc), never by loading every row
    into Python and counting there — see README "SQL Analytics".
    """

    def __init__(self, db: Session):
        self.db = db

    def create(self, click_event: ClickEvent) -> ClickEvent:
        self.db.add(click_event)
        self.db.flush()
        return click_event

    def _date_filter(self, stmt: Select, start: datetime | None, end: datetime | None) -> Select:
        if start is not None:
            stmt = stmt.where(ClickEvent.clicked_at >= start)
        if end is not None:
            stmt = stmt.where(ClickEvent.clicked_at <= end)
        return stmt

    def total_clicks(self, url_id: uuid.UUID, start: datetime | None, end: datetime | None) -> int:
        stmt = select(func.count()).select_from(ClickEvent).where(ClickEvent.url_id == url_id)
        stmt = self._date_filter(stmt, start, end)
        return self.db.execute(stmt).scalar_one()

    def unique_visitors(self, url_id: uuid.UUID, start: datetime | None, end: datetime | None) -> int:
        stmt = select(func.count(func.distinct(ClickEvent.visitor_hash))).where(
            ClickEvent.url_id == url_id, ClickEvent.visitor_hash.is_not(None)
        )
        stmt = self._date_filter(stmt, start, end)
        return self.db.execute(stmt).scalar_one()

    def clicks_today(self, url_id: uuid.UUID) -> int:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        stmt = select(func.count()).where(ClickEvent.url_id == url_id, ClickEvent.clicked_at >= today_start)
        return self.db.execute(stmt).scalar_one()

    def clicks_over_time(
        self, url_id: uuid.UUID, start: datetime | None, end: datetime | None
    ) -> list[tuple[datetime, int]]:
        day = func.date_trunc("day", ClickEvent.clicked_at).label("day")
        stmt = select(day, func.count().label("count")).where(ClickEvent.url_id == url_id)
        stmt = self._date_filter(stmt, start, end).group_by(day).order_by(day)
        return list(self.db.execute(stmt).all())

    def top_values(
        self,
        url_id: uuid.UUID,
        column: ColumnElement,
        start: datetime | None,
        end: datetime | None,
        limit: int = 5,
    ) -> list[tuple[str, int]]:
        stmt = select(column, func.count().label("count")).where(
            ClickEvent.url_id == url_id, column.is_not(None)
        )
        stmt = (
            self._date_filter(stmt, start, end)
            .group_by(column)
            .order_by(func.count().desc())
            .limit(limit)
        )
        return list(self.db.execute(stmt).all())
