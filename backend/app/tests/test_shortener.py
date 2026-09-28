from unittest.mock import patch

import pytest
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.exceptions import ConflictError, GoneError, NotFoundError, ValidationAppError
from app.schemas.url import URLCreate
from app.services.shortener_service import ShortenerService


def test_create_url_with_generated_code(db: Session, settings: Settings):
    service = ShortenerService(db, settings)
    url = service.create_url(URLCreate(original_url="https://example.com/foo"), user_id=None)

    assert url.id is not None
    assert len(url.short_code) == settings.short_code_length
    assert url.is_active is True
    assert url.total_clicks == 0


def test_create_url_rejects_invalid_scheme():
    with pytest.raises(ValueError):
        URLCreate(original_url="ftp://example.com/file")


def test_custom_alias_is_used_as_short_code(db: Session, settings: Settings):
    service = ShortenerService(db, settings)
    url = service.create_url(
        URLCreate(original_url="https://example.com", custom_alias="my-cool-link"), user_id=None
    )
    assert url.short_code == "my-cool-link"
    assert url.custom_alias == "my-cool-link"


def test_reserved_alias_is_rejected(db: Session, settings: Settings):
    service = ShortenerService(db, settings)
    with pytest.raises(ValidationAppError):
        service.create_url(URLCreate(original_url="https://example.com", custom_alias="admin"), user_id=None)


def test_duplicate_alias_raises_conflict(db: Session, settings: Settings):
    service = ShortenerService(db, settings)
    service.create_url(URLCreate(original_url="https://a.com", custom_alias="dupe-test"), user_id=None)
    db.flush()

    with pytest.raises(ConflictError):
        service.create_url(URLCreate(original_url="https://b.com", custom_alias="dupe-test"), user_id=None)


def test_collision_triggers_retry_and_eventually_succeeds(db: Session, settings: Settings):
    """Force the first two generated codes to collide with an existing row,
    then let the third succeed — proves the retry loop actually retries
    rather than failing on the first collision.
    """
    service = ShortenerService(db, settings)
    existing = service.create_url(URLCreate(original_url="https://taken.com"), user_id=None)
    db.flush()
    taken_code = existing.short_code

    codes = iter([taken_code, taken_code, "freshcode1"])
    with patch("app.services.shortener_service.generate_short_code", side_effect=lambda length: next(codes)):
        url = service.create_url(URLCreate(original_url="https://new.com"), user_id=None)

    assert url.short_code == "freshcode1"


def test_collision_exhausts_retries_and_raises(db: Session, settings: Settings):
    service = ShortenerService(db, settings)
    existing = service.create_url(URLCreate(original_url="https://taken2.com"), user_id=None)
    db.flush()
    taken_code = existing.short_code

    with patch("app.services.shortener_service.generate_short_code", return_value=taken_code):
        with pytest.raises(RuntimeError):
            service.create_url(URLCreate(original_url="https://new2.com"), user_id=None)


def test_resolve_for_redirect_not_found(db: Session, settings: Settings):
    service = ShortenerService(db, settings)
    with pytest.raises(NotFoundError):
        service.resolve_for_redirect("nonexistent")


def test_resolve_for_redirect_disabled_link_is_gone(db: Session, settings: Settings):
    service = ShortenerService(db, settings)
    url = service.create_url(URLCreate(original_url="https://disabled.com"), user_id=None)
    url.is_active = False
    db.flush()

    with pytest.raises(GoneError):
        service.resolve_for_redirect(url.short_code)


def test_resolve_for_redirect_expired_link_is_gone(db: Session, settings: Settings):
    from datetime import datetime, timedelta, timezone

    service = ShortenerService(db, settings)
    url = service.create_url(
        URLCreate(
            original_url="https://expired.com",
            expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        ),
        user_id=None,
    )
    db.flush()

    with pytest.raises(GoneError):
        service.resolve_for_redirect(url.short_code)
