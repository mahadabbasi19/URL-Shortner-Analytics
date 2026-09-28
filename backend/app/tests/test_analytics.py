import uuid
from datetime import datetime, timedelta, timezone

from app.models.click_event import ClickEvent
from app.schemas.url import URLCreate
from app.services import click_recording_service
from app.services.analytics_service import AnalyticsService
from app.services.shortener_service import ShortenerService

def _make_click(db, url_id, **overrides) -> ClickEvent:
    defaults = dict(
        url_id=url_id,
        country="Pakistan",
        city="Lahore",
        referrer_domain="google.com",
        browser="Chrome",
        operating_system="Windows",
        device_type="Desktop",
        visitor_hash="hash1",
    )
    defaults.update(overrides)
    event = ClickEvent(**defaults)
    db.add(event)
    db.flush()
    return event


def test_analytics_summary_aggregates_correctly(db, settings):
    service = ShortenerService(db, settings)
    url = service.create_url(URLCreate(original_url="https://example.com/analytics-test"), user_id=None)
    db.flush()

    _make_click(db, url.id, visitor_hash="visitor-1")
    _make_click(db, url.id, visitor_hash="visitor-1")  # same visitor, second click
    _make_click(
        db,
        url.id,
        visitor_hash="visitor-2",
        country="Germany",
        city="Berlin",
        referrer_domain="Direct/Unknown",
        browser="Firefox",
        operating_system="Linux",
    )
    db.commit()

    summary = AnalyticsService(db).get_summary(url.id, None, None)

    assert summary.total_clicks == 3
    assert summary.unique_visitors == 2  # COUNT(DISTINCT visitor_hash)
    assert {c.name for c in summary.top_countries} == {"Pakistan", "Germany"}
    browser_counts = {b.name: b.count for b in summary.browsers}
    assert browser_counts["Chrome"] == 2
    assert browser_counts["Firefox"] == 1


def test_analytics_date_filter_excludes_out_of_range_clicks(db, settings):
    service = ShortenerService(db, settings)
    url = service.create_url(URLCreate(original_url="https://example.com/date-filter-test"), user_id=None)
    db.flush()

    old_click = _make_click(db, url.id, visitor_hash="old")
    old_click.clicked_at = datetime.now(timezone.utc) - timedelta(days=10)
    _make_click(db, url.id, visitor_hash="recent")
    db.commit()

    start = datetime.now(timezone.utc) - timedelta(days=1)
    summary = AnalyticsService(db).get_summary(url.id, start, None)

    assert summary.total_clicks == 1


def test_analytics_endpoint_returns_404_for_missing_url(client):
    resp = client.get(f"/api/v1/urls/{uuid.uuid4()}/analytics")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"


def test_analytics_endpoint_returns_summary(client, db, settings):
    service = ShortenerService(db, settings)
    url = service.create_url(URLCreate(original_url="https://example.com/api-analytics"), user_id=None)
    db.commit()

    _make_click(db, url.id)
    db.commit()

    resp = client.get(f"/api/v1/urls/{url.id}/analytics")

    assert resp.status_code == 200
    assert resp.json()["total_clicks"] == 1


def test_full_redirect_to_analytics_pipeline(client, db, settings, redis_client, monkeypatch):
    """End-to-end: a real redirect request schedules record_click as a
    BackgroundTask; TestClient runs background tasks synchronously before
    returning, so by the time we check analytics, the click is recorded.
    """
    monkeypatch.setattr(click_recording_service, "SessionLocal", lambda: db)

    service = ShortenerService(db, settings)
    url = service.create_url(URLCreate(original_url="https://example.com/e2e"), user_id=None)
    db.commit()
    short_code, url_id = url.short_code, url.id  # captured before the background task closes `db`

    resp = client.get(
        f"/{short_code}",
        follow_redirects=False,
        headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
            "Referer": "https://www.google.com/",
        },
    )
    assert resp.status_code == 302

    summary = AnalyticsService(db).get_summary(url_id, None, None)
    assert summary.total_clicks == 1
    assert summary.top_referrers[0].name == "google.com"
    assert summary.browsers[0].name == "Chrome"
    assert summary.devices[0].name == "Desktop"
