def test_register_creates_user(client):
    resp = client.post("/api/v1/auth/register", json={"email": "alice@example.com", "password": "supersecret"})

    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "alice@example.com"
    assert "id" in body
    assert "password" not in body
    assert "password_hash" not in body


def test_register_rejects_duplicate_email(client):
    payload = {"email": "bob@example.com", "password": "supersecret"}
    client.post("/api/v1/auth/register", json=payload)

    resp = client.post("/api/v1/auth/register", json=payload)

    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "conflict"


def test_register_rejects_short_password(client):
    resp = client.post("/api/v1/auth/register", json={"email": "short@example.com", "password": "123"})
    assert resp.status_code == 422


def test_login_with_correct_credentials_returns_token(client):
    client.post("/api/v1/auth/register", json={"email": "carol@example.com", "password": "supersecret"})

    resp = client.post("/api/v1/auth/login", json={"email": "carol@example.com", "password": "supersecret"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert len(body["access_token"]) > 20


def test_login_with_wrong_password_returns_401(client):
    client.post("/api/v1/auth/register", json={"email": "dave@example.com", "password": "supersecret"})

    resp = client.post("/api/v1/auth/login", json={"email": "dave@example.com", "password": "wrong-password"})

    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "unauthorized"


def test_login_with_nonexistent_email_returns_401(client):
    resp = client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "whatever1"})
    assert resp.status_code == 401


def test_me_requires_authentication(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_rejects_garbage_token(client):
    resp = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


def test_me_returns_current_user_for_valid_token(client):
    client.post("/api/v1/auth/register", json={"email": "erin@example.com", "password": "supersecret"})
    login_resp = client.post("/api/v1/auth/login", json={"email": "erin@example.com", "password": "supersecret"})
    token = login_resp.json()["access_token"]

    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 200
    assert resp.json()["email"] == "erin@example.com"
