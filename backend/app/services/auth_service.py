import logging

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserLogin

logger = logging.getLogger("app.auth")


class AuthService:
    def __init__(self, db: Session, settings: Settings):
        self.db = db
        self.settings = settings
        self.repo = UserRepository(db)

    def register(self, data: UserCreate) -> User:
        user = User(email=data.email.lower(), password_hash=hash_password(data.password))
        try:
            # SAVEPOINT: a duplicate-email conflict must only undo this
            # insert, not any other pending work on the session — same
            # reasoning as the short-code collision retry in
            # ShortenerService.
            with self.db.begin_nested():
                self.repo.create(user)
        except IntegrityError:
            raise ConflictError("An account with this email already exists.")
        return user

    def authenticate(self, data: UserLogin) -> User:
        user = self.repo.get_by_email(data.email.lower())
        # Deliberately identical error for "no such user" and "wrong
        # password" — a distinct message would let an attacker enumerate
        # registered emails.
        if user is None or not verify_password(data.password, user.password_hash):
            logger.warning("Failed login attempt for email=%s", data.email.lower())
            raise UnauthorizedError("Invalid email or password.")
        return user

    def create_token_for(self, user: User) -> str:
        return create_access_token(str(user.id), self.settings)
