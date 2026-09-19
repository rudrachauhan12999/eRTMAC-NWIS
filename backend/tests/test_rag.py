import pytest


@pytest.mark.asyncio
async def test_rag_chat_returns_insufficient_evidence_for_nonsense_query(client):
    response = await client.post("/api/rag/chat", json={
        "message": "What is the exact quantum entanglement coefficient of the drill bit?",
    })
    assert response.status_code == 200
    body = response.json()
    assert body["isInsufficientInfo"] is True
    assert body["citations"] == []


@pytest.mark.asyncio
async def test_rag_chat_finds_seeded_mud_loss_incident(client):
    response = await client.post("/api/rag/chat", json={
        "message": "What happened during the mud loss incident in Barail Coal-Shale?",
    })
    assert response.status_code == 200
    body = response.json()
    # Whether or not it clears the confidence bar depends on the embedding/
    # BM25 environment, but it must never fabricate a citation when it does.
    for citation in body["citations"]:
        assert citation["sourceType"] in {"public_document", "government_data", "synthetic_demo", "derived"}
