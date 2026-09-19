"""Phase 5 seed script.

Loads:
  1. The frontend's own demo fixtures (wells/formations/events/alerts,
     exported from src/data/*.ts by scripts/export_frontend_fixtures.ts
     into app/db/seed_data/frontend_fixtures.json) — tagged
     sourceType="synthetic_demo" throughout, per the team's decision
     recorded in docs/BACKEND_API_CONTRACT.md. These are NOT real OIL
     India records; they're the pre-existing AI-Studio-generated UI
     fixtures, preserved so the frontend keeps looking exactly as it does
     today (nothing here is newly invented).
  2. Metadata rows (not content) for the 5 real OIL India PDFs in
     data/raw/oil_india/ — tagged sourceType="public_document". Actual
     text extraction/indexing happens via POST /api/documents/index
     (Phase 4/6), not here.
  3. The 4 preset demo operator accounts from src/types/auth.ts, with a
     shared DEV-ONLY seed password (see docs/DATA_SOURCES.md) — real auth
     still requires this password, it is not a bypass.

Run with: python -m app.db.seed
"""

import asyncio
import json
import time
import uuid
from pathlib import Path

from app.config import get_settings
from app.db.mongodb import close_mongo_connection, connect_to_mongo, get_database
from app.db.repositories import (
    alerts_repo,
    chunks_repo,
    documents_repo,
    events_repo,
    formations_repo,
    users_repo,
    wells_repo,
)
from app.rag import embeddings
from app.rag.synthetic_demo import DEMO_SOURCE, build_synthetic_demo_chunk, build_synthetic_demo_document
from app.security import hash_password

SEED_DATA_DIR = Path(__file__).parent / "seed_data"
FIXTURES_PATH = SEED_DATA_DIR / "frontend_fixtures.json"

DEMO_SEED_PASSWORD = "ChangeMe123!"  # dev/demo only — see docs/DATA_SOURCES.md

PRESET_USERS = [
    {"id": "user-chauhan", "name": "Er. R. Chauhan", "email": "rudrachauhan12805@gmail.com",
     "role": "Lead Drilling Engineer", "department": "Duliajan Rig Operational Command",
     "badgeNumber": "OIL-ER-8942", "clearanceLevel": "Level 3 - Rig Master Clearance",
     "roleGroup": "DRILLING_ENGINEER"},
    {"id": "user-director", "name": "Shri A. K. Sharma", "email": "ak_sharma@oilindia.in",
     "role": "Director of Drilling Operations", "department": "Directorate General of Hydrocarbons (DGH) / MoPNG",
     "badgeNumber": "OIL-EXEC-004", "clearanceLevel": "Level 4 - Executive Command & Audit",
     "roleGroup": "ADMIN"},
    {"id": "user-baruah", "name": "Dr. S. Baruah", "email": "s_baruah@oilindia.in",
     "role": "Chief Geologist & Petrophysicist", "department": "Assam-Arakan Basin Geoscience Wing",
     "badgeNumber": "OIL-GEO-1102", "clearanceLevel": "Level 3 - Subsurface Horizons Access",
     "roleGroup": "GEOLOGIST"},
    {"id": "user-gogoi", "name": "P. K. Gogoi", "email": "pk_gogoi@oilindia.in",
     "role": "Senior Drilling Fluids Specialist", "department": "Mud Engineering & Rheology Division",
     "badgeNumber": "OIL-MUD-408", "clearanceLevel": "Level 2 - Chemical & ECD Controls",
     "roleGroup": "SUPERVISOR"},
]

OIL_INDIA_PDF_NAMES = [
    "1_OCS_Bhogpara_0.pdf",
    "2_Doomdoma_Pengry.pdf",
    "3_GCS_hebeda_FGGS_Chabua_GMS_Tengakhat_GCS_0.pdf",
    "4_Ningru_0.pdf",
    "11_Moran_1.pdf",
]


async def seed_frontend_fixtures(db) -> None:
    if not FIXTURES_PATH.exists():
        print(f"WARNING: {FIXTURES_PATH} not found. Run `npx tsx scripts/export_frontend_fixtures.ts` "
              "from the repo root first, then re-run this seed script.")
        return

    fixtures = json.loads(FIXTURES_PATH.read_text(encoding="utf-8"))

    wells = [{**w, "source": DEMO_SOURCE, "sourceType": "synthetic_demo"} for w in fixtures["wells"]]
    await wells_repo.upsert_wells(db, wells)

    formations = [{**f, "source": DEMO_SOURCE, "sourceType": "synthetic_demo"} for f in fixtures["formations"]]
    await formations_repo.upsert_formations(db, formations)

    events = [{**e, "source": DEMO_SOURCE, "sourceType": "synthetic_demo"} for e in fixtures["events"]]
    await events_repo.upsert_events(db, events)

    alerts = [{**a, "isSimulation": True} for a in fixtures["alerts"]]
    await alerts_repo.upsert_alerts(db, alerts)

    print(f"Seeded {len(wells)} wells, {len(formations)} formations, {len(events)} events, "
          f"{len(alerts)} alerts (all tagged synthetic_demo).")


async def seed_synthetic_demo_chunks(db) -> None:
    """Turns each demo HistoricalIncident into a searchable document_chunk
    (sourceType="synthetic_demo"), so the RAG dual corpus (real PDFs +
    labeled demo fixtures — docs/BACKEND_API_CONTRACT.md) actually has
    something to retrieve from on the demo side. These incidents are
    already plain text (no PDF to extract), so they bypass
    app.ingestion.pipeline and are chunked directly here, one chunk per
    incident (they're short enough not to need splitting).
    """
    if not FIXTURES_PATH.exists():
        return
    fixtures = json.loads(FIXTURES_PATH.read_text(encoding="utf-8"))

    chunks = []
    for incident in fixtures["events"]:
        chunks.append(build_synthetic_demo_chunk(incident))
        doc = build_synthetic_demo_document(incident)
        doc["uploadedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        await documents_repo.upsert_document(db, doc)

    # insert_chunks() deletes-then-inserts per documentId, so group by
    # documentId to avoid one incident's insert wiping another's in the
    # same document (reportId can repeat across similar incidents).
    by_document: dict[str, list[dict]] = {}
    for chunk in chunks:
        by_document.setdefault(chunk["documentId"], []).append(chunk)
    for doc_chunks in by_document.values():
        await chunks_repo.insert_chunks(db, doc_chunks)

    if embeddings.vector_search_available():
        embeddings.upsert_chunks(chunks)
    else:
        print(f"NOTE: vector search unavailable ({embeddings.disabled_reason()}); "
              "synthetic demo chunks are still BM25-searchable, just not embedded yet.")

    print(f"Indexed {len(chunks)} synthetic-demo incident chunks across {len(by_document)} pseudo-documents.")


async def seed_document_metadata(db) -> None:
    settings = get_settings()
    raw_oil_india_dir = Path(settings.RAW_DATA_PATH) / "oil_india"

    for pdf_name in OIL_INDIA_PDF_NAMES:
        pdf_path = raw_oil_india_dir / pdf_name
        if not pdf_path.exists():
            print(f"WARNING: expected real source PDF not found: {pdf_path}")
            continue

        existing = await db["documents"].find_one({"documentName": pdf_name})
        document_id = existing["documentId"] if existing else str(uuid.uuid4())

        doc = {
            "documentId": document_id,
            "documentName": pdf_name,
            "source": "Oil India Limited (public document)",
            "sourceType": "public_document",
            "pageCount": existing.get("pageCount", 0) if existing else 0,
            "uploadedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "indexed": existing.get("indexed", False) if existing else False,
            "storagePath": str(pdf_path.resolve()),
        }
        await documents_repo.upsert_document(db, doc)

    print(f"Registered metadata for {len(OIL_INDIA_PDF_NAMES)} real OIL India source PDFs "
          "(not yet indexed — call POST /api/documents/index per document to ingest).")


async def seed_users(db) -> None:
    users = [{**u, "passwordHash": hash_password(DEMO_SEED_PASSWORD)} for u in PRESET_USERS]
    await users_repo.seed_users_if_empty(db, users)
    print(f"Seeded {len(users)} demo operator accounts. Dev/demo password for all: {DEMO_SEED_PASSWORD!r} "
          "(rotate before any non-local deployment).")


async def main() -> None:
    await connect_to_mongo()
    db = get_database()
    try:
        await seed_frontend_fixtures(db)
        await seed_synthetic_demo_chunks(db)
        await seed_document_metadata(db)
        await seed_users(db)
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
