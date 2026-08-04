# backend/main.py

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.api.add_node import (
    router as add_node_router,
)
from backend.api.add_node_by_action import (
    router as add_node_by_action_router,
)
from backend.api.artifact import (
    router as artifact_router,
)
from backend.api.cases import (
    router as cases_router,
)
from backend.api.create_artifacts import (
    router as create_artifacts_router,
)
from backend.api.create_case import (
    router as create_case_router,
)
from backend.api.delete_node import (
    router as delete_node_router,
)
from backend.api.graph import (
    router as graph_router,
)
from backend.api.legal_check import (
    router as legal_check_router,
)
from backend.api.node import (
    router as node_router,
)
from backend.api.sidebar_stats import (
    router as sidebar_stats_router,
)
from backend.api.upload_document import (
    router as upload_document_router,
)
from backend.auth.router import (
    router as auth_router,
)
from backend.config import settings
from backend.database.init_db import create_indexes
from backend.database.mongo import (
    verify_database_connection,
)


BACKEND_DIRECTORY = Path(__file__).resolve().parent
STATIC_DIRECTORY = BACKEND_DIRECTORY / "static"
FAVICON_PATH = STATIC_DIRECTORY / "favicon.ico"


@asynccontextmanager
async def lifespan(app: FastAPI):
    verify_database_connection()
    create_indexes()

    print(
        "Casendra backend started "
        f"[environment={settings.app_environment.value}, "
        f"auth_mode={settings.auth_mode.value}, "
        f"database={settings.mongodb_database}]"
    )

    yield


app = FastAPI(
    title="Casendra API",
    version="0.1.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIRECTORY),
    name="static",
)


@app.get("/", tags=["system"])
def root() -> dict[str, str]:
    return {
        "name": "Casendra API",
        "version": app.version,
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "environment": settings.app_environment.value,
        "auth_mode": settings.auth_mode.value,
    }


@app.get(
    "/favicon.ico",
    include_in_schema=False,
    response_class=FileResponse,
)
def favicon() -> FileResponse:
    return FileResponse(
        path=FAVICON_PATH,
        media_type="image/x-icon",
        filename="favicon.ico",
    )


app.include_router(
    auth_router,
    prefix="/api",
)

app.include_router(
    graph_router,
    prefix="/api",
)

app.include_router(
    node_router,
    prefix="/api",
)

app.include_router(
    cases_router,
    prefix="/api",
)

app.include_router(
    add_node_router,
    prefix="/api",
)

app.include_router(
    add_node_by_action_router,
    prefix="/api",
)

app.include_router(
    delete_node_router,
    prefix="/api",
)

app.include_router(
    legal_check_router,
    prefix="/api",
)

app.include_router(
    create_case_router,
    prefix="/api",
)

app.include_router(
    sidebar_stats_router,
    prefix="/api",
)

app.include_router(
    create_artifacts_router,
    prefix="/api",
)

app.include_router(
    artifact_router,
    prefix="/api",
)

app.include_router(
    upload_document_router,
    prefix="/api",
    tags=["documents"],
)