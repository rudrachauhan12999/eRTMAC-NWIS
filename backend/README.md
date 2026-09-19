# eRTMAC-NWIS Backend

FastAPI + MongoDB + hybrid RAG backend for the (locked, unmodified) frontend at the repo
root. See `../docs/BACKEND_API_CONTRACT.md` for the full API surface and
`../docs/DATA_SOURCES.md` for what data actually backs each endpoint.

## Local setup

```bash
# 1. MongoDB
# This machine doesn't have WSL2, so Docker Desktop's engine can't run here —
# MongoDB Community Server is installed natively as a Windows service instead
# (see winget install MongoDB.Server). It listens on localhost:27017 same as
# the Docker Compose setup would have. `docker compose up -d mongo` remains
# the path on any machine where Docker actually works (e.g. deployment).

# 2. Python deps
cd backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # macOS/Linux

# 3. Config
cp .env.example .env
# edit .env — at minimum leave MONGODB_URI pointing at localhost:27017.
# GROQ_API_KEY is optional: without it, /api/rag/chat still does real
# retrieval but falls back to templated (non-LLM) answer synthesis.

# 4. Export the frontend's demo fixtures to JSON, then seed MongoDB
cd ..
npm install
npx tsx scripts/export_frontend_fixtures.ts
cd backend
./.venv/Scripts/python.exe -m app.db.seed

# 5. Run the API
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

Health check: `curl http://localhost:8000/api/health`

## Tests

```bash
./.venv/Scripts/python.exe -m pytest
```

## Demo login

Seeded accounts (see `app/db/seed.py`) all share the dev-only password
`ChangeMe123!` — e.g. `rudrachauhan12805@gmail.com` / `ChangeMe123!`. Rotate before any
non-local deployment; this password is intentionally documented, not a leaked secret.

## Indexing real source documents

The 5 real OIL India PDFs in `../data/raw/oil_india/` are registered (not yet text-indexed)
by the seed script. To index one for RAG retrieval:

```bash
curl -X POST http://localhost:8000/api/documents/index \
  -H "Content-Type: application/json" \
  -d '{"documentId": "<id from GET /api/documents>"}'
```

(Requires an ADMIN/SUPERVISOR bearer token in a real deployment — the seed script's demo
accounts include one, e.g. `ak_sharma@oilindia.in`.)

## Architecture notes

- **Schemas mirror the frontend's TypeScript interfaces field-for-field** (camelCase, exact
  names) — see `app/schemas/`. This is deliberate: the frontend is locked, so the backend
  adapts to it, not the other way around.
- **RAG retrieval is dual-corpus**: real PDF-derived chunks (`sourceType: public_document`)
  and the frontend's own demo well/incident fixtures (`sourceType: synthetic_demo`), both
  searchable, always distinguishable in every citation. See `docs/DATA_SOURCES.md`.
- **LLM provider is Groq**, abstracted behind `app/services/llm_provider.py` — swapping
  providers later touches nothing in `app/rag/`.
- **Risk engine (Stage 1) is rule/similarity-based**, not ML — see
  `app/services/risk_engine.py` for why (insufficient labelled incident data to train or
  justify a model). Every number in its response is traceable to an input, a stored
  formation record, or a set of matched historical event documents.
- Vector search (Chroma + sentence-transformers) and cross-encoder reranking degrade
  gracefully to BM25-only if those optional dependencies aren't available in the
  environment — see `app/rag/embeddings.py`.
