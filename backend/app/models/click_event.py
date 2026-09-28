import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ClickEvent(Base):
    __tablename__ = "click_events"
    __table_args__ = (
        # The core analytics access pattern: "clicks for url X between date A and B".
        # url_id leads because every analytics query filters by a single URL first;
        # clicked_at as the second column lets Postgres range-scan the date filter
        # and satisfy ORDER BY clicked_at without a separate sort.
        Index("ix_click_events_url_id_clicked_at", "url_id", "clicked_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    url_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("urls.id", ondelete="CASCADE"), nullable=False
    )
    clicked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )

    # SHA-256 of (IP + User-Agent + daily salt), never the raw IP. Lets us
    # estimate unique visitors per day without retaining PII. See README
    # "Privacy Considerations".
    visitor_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)

    referrer: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    referrer_domain: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)

    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    browser: Mapped[str | None] = mapped_column(String(100), nullable=True)
    operating_system: Mapped[str | None] = mapped_column(String(100), nullable=True)
    device_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    url: Mapped["URL"] = relationship(back_populates="click_events")
