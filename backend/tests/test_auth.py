import pytest


@pytest.mark.asyncio
async def test_login_with_seeded_demo_account(client):
    response = await client.post("/api/auth/login", json={
        "email": "rudrachauhan12805@gmail.com", "password": "ChangeMe123!",
    })
    assert response.status_code == 200
    body = response.json()
    assert "token" in body
    assert body["user"]["email"] == "rudrachauhan12805@gmail.com"
    assert body["user"]["roleGroup"] == "DRILLING_ENGINEER"
    assert "passwordHash" not in body["user"]


@pytest.mark.asyncio
async def test_login_rejects_wrong_password(client):
    response = await client.post("/api/auth/login", json={
        "email": "rudrachauhan12805@gmail.com", "password": "wrong-password",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_bearer_token(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_register_and_login_new_account(client):
    import uuid
    email = f"test-{uuid.uuid4().hex[:8]}@oilindia.in"
    response = await client.post("/api/auth/register", json={
        "name": "Test Engineer", "email": email, "password": "TestPass123!",
        "role": "Wellsite Geologist", "department": "Test Wing",
    })
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == email
    assert body["user"]["roleGroup"] == "GEOLOGIST"

    duplicate = await client.post("/api/auth/register", json={
        "name": "Test Engineer", "email": email, "password": "TestPass123!",
        "role": "Wellsite Geologist", "department": "Test Wing",
    })
    assert duplicate.status_code == 409


@pytest.mark.asyncio
async def test_me_returns_current_user(client):
    login = await client.post("/api/auth/login", json={
        "email": "rudrachauhan12805@gmail.com", "password": "ChangeMe123!",
    })
    token = login.json()["token"]
    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "rudrachauhan12805@gmail.com"
