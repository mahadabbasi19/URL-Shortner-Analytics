import logging
import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.exceptions import ConflictError, GoneError, NotFoundError, ValidationAppError
from app.models.url import URL
from app.repositories.url_repository import URLRepository
from app.schemas.url import URLCreate
from app.utils.base62 import generate_short_code
from app.utils.reserved_aliases import is_reserved

logger = logging.getLogger("app.shortener")


class ShortenerService:
    """Owns short-code generation and collision handling.

    Flow: generate a candidate code -> attempt INSERT -> if the database's
    unique constraint on short_code rejects it (a collision), roll back and
    retry with a new code, up to max_retries. The database, not an
    in-application check-then-insert, is the source of truth for uniqueness
    — that avoids a race where two requests generate the same code, both
    pass an application-level existence check, and both try to insert.
    """

    def __init__(self, db: Session, settings: Settings):
        self.db = db
        self.settings = settings
        self.repo = URLRepository(db)

    def create_url(self, data: URLCreate, user_id: uuid.UUID | None) -> URL:
        if data.custom_alias:
            return self._create_with_alias(data, user_id)
        return self._create_with_generated_code(data, user_id)

    def _create_with_alias(self, data: URLCreate, user_id: uuid.UUID | None) -> URL:
        alias = data.custom_alias
        if is_reserved(alias):
            raise ValidationAppError(f"'{alias}' is a reserved word and cannot be used as an alias.")

        url = URL(
            user_id=user_id,
            original_url=data.original_url,
            short_code=alias,
            custom_alias=alias,
            title=data.title,
            expires_at=data.expires_at,
        )
        try:
            # SAVEPOINT, not a full rollback: a failed insert must only
            # undo itself, not any other work already pending on this
            # session/request.
            with self.db.begin_nested():
                self.repo.create(url)
        except IntegrityError:
            raise ConflictError(f"Alias '{alias}' is already taken.")
        return url

    def _create_with_generated_code(self, data: URLCreate, user_id: uuid.UUID | None) -> URL:
        last_error: Exception | None = None
        for attempt in range(1, self.settings.short_code_max_retries + 1):
            code = generate_short_code(self.settings.short_code_length)
            url = URL(
                user_id=user_id,
                original_url=data.original_url,
                short_code=code,
                title=data.title,
                expires_at=data.expires_at,
            )
            try:
                with self.db.begin_nested():
                    self.repo.create(url)
                return url
            except IntegrityError as exc:
                last_error = exc
                logger.warning(
                    "Short code collision on attempt %d/%d (code=%s)",
                    attempt,
                    self.settings.short_code_max_retries,
                    code,
                )

        logger.error(
            "Exhausted %d short-code generation attempts without success",
            self.settings.short_code_max_retries,
        )
        raise RuntimeError("Failed to generate a unique short code") from last_error

    def resolve_for_redirect(self, short_code: str) -> URL:
        url = self.repo.get_by_short_code(short_code)
        if url is None:
            raise NotFoundError("Short link not found.")
        if not URLRepository.is_usable(url):
            raise GoneError("This link has expired or been disabled.")
        return url
