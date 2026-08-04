# backend/database/mongo.py

from __future__ import annotations

from pymongo import MongoClient
from pymongo.database import Database

from backend.config import settings


client: MongoClient = MongoClient(
    settings.mongodb_uri,
    serverSelectionTimeoutMS=10_000,
)

db: Database = client[settings.mongodb_database]


def verify_database_connection() -> None:
    """
    Fail early if MongoDB is unreachable.

    This is called during FastAPI startup so that configuration or
    connectivity errors are reported immediately.
    """
    client.admin.command("ping")