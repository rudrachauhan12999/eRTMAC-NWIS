import pytest


async def _admin_token(client) -> str:
    login = await client.post("/api/auth/login", json={
        "email": "ak_sharma@oilindia.in", "password": "ChangeMe123!",
    })
    return login.json()["token"]


@pytest.mark.asyncio
async def test_upload_requires_admin_role(client):
    response = await client.post("/api/documents/upload", files={"file": ("test.txt", b"hello world")})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_upload_and_duplicate_detection(client):
    token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    first = await client.post("/api/documents/upload", files={"file": ("dup_test.txt", b"identical content for dedup test")}, headers=headers)
    assert first.status_code == 200
    first_id = first.json()["documentId"]

    second = await client.post("/api/documents/upload", files={"file": ("dup_test_renamed.txt", b"identical content for dedup test")}, headers=headers)
    assert second.status_code == 200
    assert second.json()["documentId"] == first_id, "same content should resolve to the same document, not duplicate"

    await client.delete(f"/api/documents/{first_id}", headers=headers)


@pytest.mark.asyncio
async def test_delete_document_removes_it(client):
    token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    uploaded = await client.post("/api/documents/upload", files={"file": ("to_delete.txt", b"delete me please")}, headers=headers)
    document_id = uploaded.json()["documentId"]

    delete_response = await client.delete(f"/api/documents/{document_id}", headers=headers)
    assert delete_response.status_code == 204

    get_response = await client.get(f"/api/documents/{document_id}")
    assert get_response.status_code == 404
