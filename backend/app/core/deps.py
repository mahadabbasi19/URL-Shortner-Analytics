import uuid

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    """Required auth: raises 401 if there's no valid, non-expired bearer
    token for an existing user. Use on endpoints that must always be
    authenticated (e.g. "list my URLs").
    """
    token = _extract_bearer_token(authorization)
    if token is None:
        raise UnauthorizedError("Authentication required.")

    subject = decode_access_token(token, settings)
    if subject is None:
        raise UnauthorizedError("Invalid or expired token.")

    try:
        user_id = uuid.UUID(subject)
    except ValueError:
        raise UnauthorizedError("Invalid or expired token.")

    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise UnauthorizedError("Invalid or expired token.")
    return user


def get_current_user_optional(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User | None:
    """Optional auth: None when no Authorization header was sent at all
    (anonymous request). A header that IS present but invalid/expired
    still raises 401 — silently downgrading a bad token to "anonymous"
    would hide auth bugs and confuse a client that thinks it's logged in.
    Use on endpoints that work for both anonymous and authenticated users
    (e.g. creating a URL, viewing an anonymous URL's analytics).
    """
    if authorization is None:
        return None
    return get_current_user(authorization=authorization, db=db, settings=settings)
