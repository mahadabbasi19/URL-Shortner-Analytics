def _register_and_login(client, email: str) -> str:
    client.post("/api/v1/auth/register", json={"email": email, "password": "supersecret"})
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "supersecret"})
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _create_url(client, token: str, **overrides) -> dict:
    payload = {"original_url": "https://example.com/manage-test"}
    payload.update(overrides)
    resp = client.post("/api/v1/urls", json=payload, headers=_auth(token))
    assert resp.status_code == 201
    return resp.json()


def test_owner_can_disable_their_url(client):
    token = _register_and_login(client, "disable-owner@example.com")
    url = _create_url(client, token)

    resp = client.patch(f"/api/v1/urls/{url['id']}", json={"is_active": False}, headers=_auth(token))

    assert resp.status_code == 200
    assert resp.json()["is_active"] is False


def test_update_only_changes_fields_sent(client):
    token = _register_and_login(client, "partial-update@example.com")
    url = _create_url(client, token, title="Original Title")

    resp = client.patch(f"/api/v1/urls/{url['id']}", json={"is_active": False}, headers=_auth(token))

    assert resp.status_code == 200
    body = resp.json()
    assert body["is_active"] is False
    assert body["title"] == "Original Title"  # untouched, since it wasn't in the request


def test_disabled_url_returns_410_on_redirect_after_cache_invalidation(client, redis_client):
    token = _register_and_login(client, "disable-redirect@example.com")
    url = _create_url(client, token)

    # warm the cache
    first = client.get(f"/{url['short_code']}", follow_redirects=False)
    assert first.status_code == 302
    assert redis_client.get(f"url:{url['short_code']}") is not None

    client.patch(f"/api/v1/urls/{url['id']}", json={"is_active": False}, headers=_auth(token))

    # cache must have been invalidated by the update, not just left stale until TTL
    assert redis_client.get(f"url:{url['short_code']}") is None

    second = client.get(f"/{url['short_code']}", follow_redirects=False)
    assert second.status_code == 410


def test_non_owner_cannot_update_url(client):
    token_a = _register_and_login(client, "update-owner@example.com")
    token_b = _register_and_login(client, "update-attacker@example.com")
    url = _create_url(client, token_a)

    resp = client.patch(f"/api/v1/urls/{url['id']}", json={"is_active": False}, headers=_auth(token_b))

    assert resp.status_code == 403


def test_owner_can_delete_their_url(client):
    token = _register_and_login(client, "delete-owner@example.com")
    url = _create_url(client, token)

    resp = client.delete(f"/api/v1/urls/{url['id']}", headers=_auth(token))
    assert resp.status_code == 204

    get_resp = client.get(f"/api/v1/urls/{url['id']}", headers=_auth(token))
    assert get_resp.status_code == 404


def test_deleted_url_redirect_returns_404_and_cache_is_cleared(client, redis_client):
    token = _register_and_login(client, "delete-redirect@example.com")
    url = _create_url(client, token)

    client.get(f"/{url['short_code']}", follow_redirects=False)  # warm cache
    assert redis_client.get(f"url:{url['short_code']}") is not None

    client.delete(f"/api/v1/urls/{url['id']}", headers=_auth(token))

    assert redis_client.get(f"url:{url['short_code']}") is None
    resp = client.get(f"/{url['short_code']}", follow_redirects=False)
    assert resp.status_code == 404


def test_non_owner_cannot_delete_url(client):
    token_a = _register_and_login(client, "delete-owner2@example.com")
    token_b = _register_and_login(client, "delete-attacker@example.com")
    url = _create_url(client, token_a)

    resp = client.delete(f"/api/v1/urls/{url['id']}", headers=_auth(token_b))

    assert resp.status_code == 403


def test_qr_code_returns_png_for_owner(client):
    token = _register_and_login(client, "qr-owner@example.com")
    url = _create_url(client, token)

    resp = client.get(f"/api/v1/urls/{url['id']}/qr", headers=_auth(token))

    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"
    assert resp.content[:8] == b"\x89PNG\r\n\x1a\n"  # PNG magic bytes


def test_qr_code_requires_ownership(client):
    token_a = _register_and_login(client, "qr-owner2@example.com")
    token_b = _register_and_login(client, "qr-attacker@example.com")
    url = _create_url(client, token_a)

    resp = client.get(f"/api/v1/urls/{url['id']}/qr", headers=_auth(token_b))

    assert resp.status_code == 403
