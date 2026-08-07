# backend/database/mongo.py

from __future__ import annotations

from pymongo import MongoClient
from pymongo.database import Database

from backend.config import settings


client = MongoClient(settings.mongodb_uri)


# --------------------------------------------------
# APPLICATION DATABASE
# --------------------------------------------------
#
# Environment-specific database.
#
# Development:
#   legal_case_simulator_dev
#
# Production:
#   legal_case_simulator
#
db: Database = client[
    settings.mongodb_database
]


# --------------------------------------------------
# VECTOR DATABASE
# --------------------------------------------------
#
# Shared database containing the law embeddings.
#
# Development and production may intentionally point
# to the same database here.
#
vector_db: Database = client[
    settings.mongodb_vector_database
]


def verify_database_connection() -> None:
    """
    Fail early if MongoDB is unreachable.

    This is called during FastAPI startup so that configuration or
    connectivity errors are reported immediately.
    """
    client.admin.command("ping")