"""Shared logic for turning a HistoricalIncident-shaped record into a
searchable document_chunk, tagged sourceType="synthetic_demo". Used by both
app.db.seed (bulk, at startup) and the Document Library's "Add Document"
endpoint (app.api.events, one at a time) so a newly-added document is
retrievable through the exact same code path — not a second, divergent
implementation.
"""

DEMO_SOURCE = "Google AI Studio-generated UI fixture (eRTMAC-NWIS) — not real Oil India data"


def build_synthetic_demo_chunk(incident: dict, source: str = DEMO_SOURCE) -> dict:
    report = incident["sourceReport"]
    text = (
        f"Incident: {incident['incidentType']} at {incident['depthM']}m in {incident['formation']} "
        f"({incident['wellName']}, {incident['date']}, severity {incident['severity']}).\n"
        f"Summary: {incident['summary']}\n"
        f"Root cause: {incident['rootCause']}\n"
        f"Recommended mitigation: {incident['recommendedMitigation']}\n"
        f"Action taken: {incident['actionTaken']}\n"
        f"Source excerpt: {report['excerpt']}"
    )
    return {
        # Deterministic (not random) so re-indexing the same incident
        # overwrites its existing chunk/embedding instead of accumulating
        # orphaned duplicates.
        "chunkId": f"synthetic-demo::{incident['id']}",
        "documentId": report["reportId"],
        "documentName": report["title"],
        "page": report["page"],
        "section": report["section"],
        "text": text,
        "source": source,
        "sourceType": "synthetic_demo",
        "wellId": incident["wellId"],
        "wellName": incident["wellName"],
        "formation": incident["formation"],
    }


def build_synthetic_demo_document(incident: dict, source: str = DEMO_SOURCE) -> dict:
    report = incident["sourceReport"]
    return {
        "documentId": report["reportId"],
        "documentName": report["title"],
        "source": source,
        "sourceType": "synthetic_demo",
        "pageCount": report["page"],
        "indexed": True,
    }
