from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, analytics, auth, documents, events, formations, health, rag, risk, telemetry, wells
from app.config import get_settings
from app.db.mongodb import close_mongo_connection, connect_to_mongo


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="eRTMAC-NWIS Backend", version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    for router in (health.router, wells.router, formations.router, events.router,
                   documents.router, rag.router, risk.router, telemetry.router,
                   alerts.router, analytics.router, auth.router):
        app.include_router(router, prefix="/api")

    return app


app = create_app()
