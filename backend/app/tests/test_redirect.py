from redis import Redis as RedisClient

from app.core.redis_client import get_redis
from app.main import app
from app.schemas.url import URLCreate
from app.services.shortener_service import ShortenerService

def test_redirect_populates_cache_on_miss_then_hits_it(client, db, settings, redis_client):
    service = ShortenerService(db, settings)
    url = service.create_url(URLCreate(original_url="https://example.com/cache-test"), user_id=None)
    db.commit()

    assert redis_client.get(f"url:{url.short_code}") is None

    resp1 = client.get(f"/{url.short_code}", follow_redirects=False)
    assert resp1.status_code == 302
    assert resp1.headers["location"] == "https://example.com/cache-test"
    assert redis_client.get(f"url:{url.short_code}") is not None

    resp2 = client.get(f"/{url.short_code}", follow_redirects=False)
    assert resp2.status_code == 302
    assert resp2.headers["location"] == "https://example.com/cache-test"


def test_redirect_increments_total_clicks_on_cache_hit(client, db, settings, redis_client):
    service = ShortenerService(db, settings)
    url = service.create_url(URLCreate(original_url="https://example.com/count-test"), user_id=None)
    db.commit()

    client.get(f"/{url.short_code}", follow_redirects=False)  # miss, populates cache
    client.get(f"/{url.short_code}", follow_redirects=False)  # hit

    db.refresh(url)
    assert url.total_clicks == 2


def test_redirect_missing_short_code_returns_404(client):
    resp = client.get("/does-not-exist", follow_redirects=False)
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"


def test_redirect_expired_link_returns_410_and_is_never_cached(client, db, settings, redis_client):
    from datetime import datetime, timedelta, timezone

    service = ShortenerService(db, settings)
    url = service.create_url(
        URLCreate(
            original_url="https://example.com/expired",
            expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        ),
        user_id=None,
    )
    db.commit()

    resp = client.get(f"/{url.short_code}", follow_redirects=False)

    assert resp.status_code == 410
    assert resp.json()["error"]["code"] == "gone"
    assert redis_client.get(f"url:{url.short_code}") is None


def test_redirect_disabled_link_returns_410_and_is_never_cached(client, db, settings, redis_client):
    service = ShortenerService(db, settings)
    url = service.create_url(URLCreate(original_url="https://example.com/disabled"), user_id=None)
    url.is_active = False
    db.commit()

    resp = client.get(f"/{url.short_code}", follow_redirects=False)

    assert resp.status_code == 410
    assert redis_client.get(f"url:{url.short_code}") is None


def test_redirect_falls_back_to_postgres_when_redis_is_unreachable(client, db, settings):
    """A dead Redis must degrade the redirect path, not break it."""
    dead_redis = RedisClient(
        host="redis-host-that-does-not-exist",
        port=6379,
        socket_connect_timeout=0.2,
        socket_timeout=0.2,
        decode_responses=True,
    )
    app.dependency_overrides[get_redis] = lambda: dead_redis

    service = ShortenerService(db, settings)
    url = service.create_url(URLCreate(original_url="https://example.com/redis-down"), user_id=None)
    db.commit()

    resp = client.get(f"/{url.short_code}", follow_redirects=False)

    assert resp.status_code == 302
    assert resp.headers["location"] == "https://example.com/redis-down"
