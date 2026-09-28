def _register_and_login(client, email: str) -> str:
    client.post("/api/v1/auth/register", json={"email": email, "password": "supersecret"})
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "supersecret"})
    return resp.json()["access_token"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_anonymous_create_still_works_without_a_token(client):
    resp = client.post("/api/v1/urls", json={"original_url": "https://example.com/anon"})
    assert resp.status_code == 201


def test_authenticated_create_attaches_owner_and_appears_in_my_urls(client):
    token = _register_and_login(client, "owner@example.com")

    create_resp = client.post(
        "/api/v1/urls", json={"original_url": "https://example.com/owned"}, headers=_auth_headers(token)
    )
    assert create_resp.status_code == 201

    list_resp = client.get("/api/v1/urls", headers=_auth_headers(token))
    assert list_resp.status_code == 200
    short_codes = [u["short_code"] for u in list_resp.json()]
    assert create_resp.json()["short_code"] in short_codes


def test_list_my_urls_requires_authentication(client):
    resp = client.get("/api/v1/urls")
    assert resp.status_code == 401


def test_user_cannot_view_another_users_url(client):
    token_a = _register_and_login(client, "alice-auth@example.com")
    token_b = _register_and_login(client, "bob-auth@example.com")

    create_resp = client.post(
        "/api/v1/urls", json={"original_url": "https://example.com/alices-link"}, headers=_auth_headers(token_a)
    )
    url_id = create_resp.json()["id"]

    resp = client.get(f"/api/v1/urls/{url_id}", headers=_auth_headers(token_b))

    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "forbidden"


def test_owner_can_view_their_own_url(client):
    token = _register_and_login(client, "self-view@example.com")
    create_resp = client.post(
        "/api/v1/urls", json={"original_url": "https://example.com/self"}, headers=_auth_headers(token)
    )
    url_id = create_resp.json()["id"]

    resp = client.get(f"/api/v1/urls/{url_id}", headers=_auth_headers(token))

    assert resp.status_code == 200
    assert resp.json()["id"] == url_id


def test_user_cannot_view_another_users_analytics(client):
    token_a = _register_and_login(client, "alice-analytics@example.com")
    token_b = _register_and_login(client, "bob-analytics@example.com")

    create_resp = client.post(
        "/api/v1/urls", json={"original_url": "https://example.com/alices-analytics"}, headers=_auth_headers(token_a)
    )
    url_id = create_resp.json()["id"]

    resp = client.get(f"/api/v1/urls/{url_id}/analytics", headers=_auth_headers(token_b))

    assert resp.status_code == 403


def test_anonymous_caller_cannot_view_owned_url_analytics(client):
    token = _register_and_login(client, "owned-analytics@example.com")
    create_resp = client.post(
        "/api/v1/urls", json={"original_url": "https://example.com/owned-analytics"}, headers=_auth_headers(token)
    )
    url_id = create_resp.json()["id"]

    resp = client.get(f"/api/v1/urls/{url_id}/analytics")  # no auth header

    assert resp.status_code == 403


def test_owner_can_view_their_own_analytics(client):
    token = _register_and_login(client, "self-analytics@example.com")
    create_resp = client.post(
        "/api/v1/urls", json={"original_url": "https://example.com/self-analytics"}, headers=_auth_headers(token)
    )
    url_id = create_resp.json()["id"]

    resp = client.get(f"/api/v1/urls/{url_id}/analytics", headers=_auth_headers(token))

    assert resp.status_code == 200
    assert resp.json()["total_clicks"] == 0


def test_anonymous_urls_analytics_remain_publicly_readable(client):
    create_resp = client.post("/api/v1/urls", json={"original_url": "https://example.com/public-analytics"})
    url_id = create_resp.json()["id"]

    resp = client.get(f"/api/v1/urls/{url_id}/analytics")  # no auth header, no owner to restrict to

    assert resp.status_code == 200
