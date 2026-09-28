import time
from unittest.mock import patch

from redis import RedisError

from app.core.config import Settings, get_settings
from app.main import app
from app.services.rate_limit_service import RateLimiter


def test_rate_limiter_allows_requests_within_limit(redis_client):
    limiter = RateLimiter(redis_client)
    for _ in range(3):
        allowed, retry_after = limiter.check("test-key-a", limit=3, window_seconds=60)
        assert allowed is True
        assert retry_after == 0


def test_rate_limiter_blocks_once_limit_is_exceeded(redis_client):
    limiter = RateLimiter(redis_client)
    limiter.check("test-key-b", limit=2, window_seconds=60)
    limiter.check("test-key-b", limit=2, window_seconds=60)

    allowed, retry_after = limiter.check("test-key-b", limit=2, window_seconds=60)

    assert allowed is False
    assert retry_after > 0


def test_rate_limiter_resets_after_the_window_elapses(redis_client):
    limiter = RateLimiter(redis_client)
    assert limiter.check("test-key-reset", limit=1, window_seconds=1)[0] is True
    assert limiter.check("test-key-reset", limit=1, window_seconds=1)[0] is False

    time.sleep(1.2)

    assert limiter.check("test-key-reset", limit=1, window_seconds=1)[0] is True


def test_rate_limiter_fails_open_on_redis_error(redis_client):
    limiter = RateLimiter(redis_client)
    with patch.object(redis_client, "incr", side_effect=RedisError("boom")):
        allowed, retry_after = limiter.check("test-key-c", limit=1, window_seconds=60)

    assert allowed is True
    assert retry_after == 0


def test_login_endpoint_returns_429_after_exceeding_configured_limit(client):
    tight_settings = Settings(rate_limit_auth_login="2/300")
    app.dependency_overrides[get_settings] = lambda: tight_settings
    try:
        payload = {"email": "ratelimit-test@example.com", "password": "wrongpass"}
        client.post("/api/v1/auth/login", json=payload)
        client.post("/api/v1/auth/login", json=payload)
        resp = client.post("/api/v1/auth/login", json=payload)

        assert resp.status_code == 429
        assert resp.json()["error"]["code"] == "rate_limited"
        assert "Retry-After" in resp.headers
    finally:
        del app.dependency_overrides[get_settings]


def test_create_url_rate_limit_is_separate_for_anonymous_vs_authenticated(client):
    """Confirms the two callers don't share a bucket: an anonymous caller
    hitting the anon limit must not affect an authenticated caller's quota.
    """
    tight_settings = Settings(rate_limit_anon_create="1/300", rate_limit_auth_create="5/300")
    app.dependency_overrides[get_settings] = lambda: tight_settings
    try:
        client.post("/api/v1/auth/register", json={"email": "quota@example.com", "password": "supersecret"})
        login_resp = client.post(
            "/api/v1/auth/login", json={"email": "quota@example.com", "password": "supersecret"}
        )
        token = login_resp.json()["access_token"]

        first_anon = client.post("/api/v1/urls", json={"original_url": "https://example.com/anon-1"})
        assert first_anon.status_code == 201
        second_anon = client.post("/api/v1/urls", json={"original_url": "https://example.com/anon-2"})
        assert second_anon.status_code == 429

        # Authenticated caller still has quota — separate bucket.
        auth_resp = client.post(
            "/api/v1/urls",
            json={"original_url": "https://example.com/auth-1"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert auth_resp.status_code == 201
    finally:
        del app.dependency_overrides[get_settings]
