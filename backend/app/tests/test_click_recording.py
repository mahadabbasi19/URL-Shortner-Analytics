import uuid

from app.models.click_event import ClickEvent
from app.repositories.click_event_repository import ClickEventRepository
from app.schemas.url import URLCreate
from app.services import click_recording_service
from app.services.shortener_service import ShortenerService


def test_record_click_creates_a_click_event(db, settings, monkeypatch):
    # The background task normally opens its own session; point it at this
    # test's session/transaction instead so the row it writes rolls back
    # with everything else at teardown.
    monkeypatch.setattr(click_recording_service, "SessionLocal", lambda: db)

    url = ShortenerService(db, settings).create_url(
        URLCreate(original_url="https://example.com/record-click-test"), user_id=None
    )
    db.flush()
    url_id = url.id  # captured before record_click closes the (shared) session below

    click_recording_service.record_click(
        url_id=url_id,
        ip="203.0.113.5",
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        referrer="https://www.google.com/search?q=test",
    )

    repo = ClickEventRepository(db)
    assert repo.total_clicks(url_id, None, None) == 1
    rows = repo.top_values(url_id, ClickEvent.browser, None, None)
    assert rows[0] == ("Chrome", 1)


def test_record_click_swallows_errors_without_raising(db, monkeypatch):
    """A malformed url_id (e.g. one that violates the FK constraint) must
    be logged, not propagated — analytics failures can't affect anything
    else running on the same process.
    """
    monkeypatch.setattr(click_recording_service, "SessionLocal", lambda: db)

    # url_id has no matching row in `urls`, violating the FK constraint on
    # click_events.url_id — this must fail soft.
    click_recording_service.record_click(
        url_id=uuid.uuid4(),
        ip="203.0.113.5",
        user_agent="some-ua",
        referrer=None,
    )
    # No exception raised is the assertion; nothing further to check.
