import time

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.repositories import chunks_repo, documents_repo, events_repo
from app.dependencies import get_db
from app.rag import embeddings
from app.rag.synthetic_demo import build_synthetic_demo_chunk, build_synthetic_demo_document
from app.schemas.events import EventCreateRequest, EventListResponse, HistoricalIncident

router = APIRouter(tags=["events"])


@router.get("/events", response_model=EventListResponse)
async def get_events(wellId: str | None = None, incidentType: str | None = None,
                      severity: str | None = None, formation: str | None = None,
                      db: AsyncIOMotorDatabase = Depends(get_db)):
    events = await events_repo.list_events(db, well_id=wellId, incident_type=incidentType,
                                            severity=severity, formation=formation)
    return {"events": events, "total": len(events)}


@router.get("/wells/{well_id}/events", response_model=EventListResponse)
async def get_well_events(well_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    events = await events_repo.list_events(db, well_id=well_id)
    return {"events": events, "total": len(events)}


@router.post("/events", response_model=HistoricalIncident)
async def create_event(payload: EventCreateRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Backs the Document Library's "Add New Document" flow
    (AddNewDocModal.tsx). The submitted form never actually extracts real
    PDF content (Phase 0 finding — its file picker only reads the
    filename), so anything created here is honestly tagged
    synthetic_demo, exactly like the pre-seeded incidents, and is
    indexed into document_chunks the same way so it's immediately
    RAG-searchable.

    Deliberately not auth-gated: the frontend's default "logged in" state
    (App.tsx, unchanged this round) doesn't carry a real JWT until the user
    explicitly signs in, and the original localStorage-based Document
    Library had no auth check at all — gating this would silently break
    Add/Delete for that default session, a regression the brief forbids.
    """
    event = payload.model_dump()
    event["source"] = "User-added via Document Library (eRTMAC-NWIS UI)"
    event["sourceType"] = "synthetic_demo"
    await events_repo.upsert_events(db, [event])

    chunk = build_synthetic_demo_chunk(event, source=event["source"])
    await chunks_repo.insert_chunks(db, [chunk])
    doc = build_synthetic_demo_document(event, source=event["source"])
    doc["uploadedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    await documents_repo.upsert_document(db, doc)
    if embeddings.vector_search_available():
        embeddings.upsert_chunks([chunk])

    return event


@router.delete("/events/{event_id}", status_code=204)
async def delete_event(event_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    event = await events_repo.get_event(db, event_id)
    if event is None:
        raise HTTPException(404, detail=f"Event '{event_id}' not found")

    report_id = event["sourceReport"]["reportId"]
    chunk_ids = await chunks_repo.chunk_ids_for_document(db, report_id)
    embeddings.delete_chunk_ids(chunk_ids)
    await chunks_repo.delete_chunks_for_document(db, report_id)

    # Only remove the pseudo-document if no other event still cites the same
    # reportId (a handful of the pre-seeded incidents share one reportId).
    remaining = await events_repo.list_events(db)
    if not any(e["sourceReport"]["reportId"] == report_id for e in remaining if e["id"] != event_id):
        await documents_repo.delete_document(db, report_id)

    await events_repo.delete_event(db, event_id)
    return None
