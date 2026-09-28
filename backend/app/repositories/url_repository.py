import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.url import URL
from app.utils.link_status import is_link_usable


class URLRepository:
    """All direct SQL access for the URL entity lives here, so services stay
    free of SQLAlchemy query-building details and are easier to unit test.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, url_id: uuid.UUID) -> URL | None:
        return self.db.get(URL, url_id)

    def get_by_short_code(self, short_code: str) -> URL | None:
        return self.db.execute(select(URL).where(URL.short_code == short_code)).scalar_one_or_none()

    def get_by_custom_alias(self, alias: str) -> URL | None:
        return self.db.execute(select(URL).where(URL.custom_alias == alias)).scalar_one_or_none()

    def list_for_user(self, user_id: uuid.UUID, limit: int = 50, offset: int = 0) -> list[URL]:
        stmt = (
            select(URL)
            .where(URL.user_id == user_id)
            .order_by(URL.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(self, url: URL) -> URL:
        self.db.add(url)
        self.db.flush()
        return url

    def delete(self, url: URL) -> None:
        self.db.delete(url)
        self.db.flush()

    def increment_clicks(self, url_id: uuid.UUID) -> None:
        url = self.get_by_id(url_id)
        if url is not None:
            url.total_clicks += 1

    @staticmethod
    def is_usable(url: URL) -> bool:
        return is_link_usable(url.is_active, url.expires_at)
