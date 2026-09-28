import uuid
from unittest.mock import patch

from redis import RedisError

from app.models.url import URL
from app.services.cache_service import CacheService


def make_url(short_code: str = "testcode1", is_active: bool = True, expires_at=None) -> URL:
    return URL(
        id=uuid.uuid4(),
        original_url="https://example.com",
        short_code=short_code,
        is_active=is_active,
        expires_at=expires_at,
        total_clicks=0,
    )


def test_cache_set_then_get_round_trips(redis_client, settings):
    cache = CacheService(redis_client, settings)
    url = make_url()

    cache.set(url)
    cached = cache.get(url.short_code)

    assert cached is not None
    assert cached["id"] == str(url.id)
    assert cached["original_url"] == "https://example.com"
    assert cached["is_active"] is True
    assert cached["expires_at"] is None


def test_cache_miss_returns_none(redis_client, settings):
    cache = CacheService(redis_client, settings)
    assert cache.get("does-not-exist") is None


def test_cache_invalidate_removes_key(redis_client, settings):
    cache = CacheService(redis_client, settings)
    url = make_url(short_code="inval-test")
    cache.set(url)
    assert cache.get("inval-test") is not None

    cache.invalidate("inval-test")

    assert cache.get("inval-test") is None


def test_cache_uses_configured_ttl(redis_client, settings):
    cache = CacheService(redis_client, settings)
    url = make_url(short_code="ttl-test")
    cache.set(url)

    ttl = redis_client.ttl("url:ttl-test")
    assert 0 < ttl <= settings.redirect_cache_ttl_seconds


def test_cache_get_fails_soft_on_redis_error(redis_client, settings):
    cache = CacheService(redis_client, settings)
    with patch.object(redis_client, "get", side_effect=RedisError("boom")):
        assert cache.get("anything") is None


def test_cache_set_fails_soft_on_redis_error(redis_client, settings):
    cache = CacheService(redis_client, settings)
    url = make_url()
    with patch.object(redis_client, "setex", side_effect=RedisError("boom")):
        cache.set(url)  # must not raise


def test_cache_get_ignores_corrupt_entry(redis_client, settings):
    cache = CacheService(redis_client, settings)
    redis_client.set("url:corrupt", "{not valid json")
    assert cache.get("corrupt") is None
