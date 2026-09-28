import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import engine, get_db
from app.core.redis_client import get_redis
from app.main import app


@pytest.fixture
def db() -> Session:
    """Each test runs inside an outer transaction that's rolled back
    afterwards, so tests never leave data behind. join_transaction_mode=
    "create_savepoint" means the Session treats the already-open external
    transaction as its root and runs its own commit()/rollback() calls
    (including ones made by application code, e.g. an API endpoint under
    test via TestClient) as SAVEPOINTs — so endpoint code can call
    db.commit() freely without ending the outer, rolled-back-on-teardown
    transaction. Requires the Postgres schema to already exist
    (`alembic upgrade head`).
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def settings():
    return get_settings()


@pytest.fixture
def redis_client():
    """A real Redis connection (this is a dev/test environment, not a
    mock) against a scratch database, flushed before and after each test.
    """
    client = get_redis()
    client.flushdb()
    yield client
    client.flushdb()


@pytest.fixture
def client(db, redis_client):
    """A TestClient wired to this test's isolated db/redis fixtures, shared
    across every test module. Centralized deliberately: a per-file client
    fixture that forgets to override get_redis lets that test's requests
    hit the real, unflushed Redis connection — which silently pollutes
    shared state like rate-limit counters across unrelated tests run in
    the same suite. One fixture, always fully isolated, avoids that class
    of flaky cross-test failure entirely.
    """
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_redis] = lambda: redis_client
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
