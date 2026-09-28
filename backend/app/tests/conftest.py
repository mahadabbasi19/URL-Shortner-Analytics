import pytest
from sqlalchemy import event
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import SessionLocal, engine


@pytest.fixture
def db() -> Session:
    """Each test runs inside an outer transaction + SAVEPOINT, rolled back
    afterwards, so tests never leave data behind. A service calling
    session.rollback() (e.g. on a short-code collision) only unwinds to the
    SAVEPOINT, not the whole outer transaction — the standard SQLAlchemy
    "join a session into an external transaction" test pattern. Requires the
    Postgres schema to already exist (`alembic upgrade head`).
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)
    session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        if trans.nested and not trans._parent.nested:
            sess.begin_nested()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def settings():
    return get_settings()
