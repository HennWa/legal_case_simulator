# backend/database/init_db.py

from __future__ import annotations

from backend.database.mongo import db


def create_indexes() -> None:
    # Users
    # Users
    db.users.create_index(
        "id",
        unique=True,
        partialFilterExpression={
            "id": {"$type": "string"},
        },
    )

    db.users.create_index(
        "email_normalized",
        unique=True,
        partialFilterExpression={
            "email_normalized": {"$type": "string"},
        },
    )

    db.users.create_index(
        "auth0_subject",
        unique=True,
        partialFilterExpression={
            "auth0_subject": {"$type": "string"},
        },
    )

    # Cases
    db.cases.create_index(
        "id",
        unique=True,
    )

    db.cases.create_index(
        "owner_id",
    )

    # Template lookup
    db.cases.create_index(
        [
            ("is_template", 1),
            ("template_key", 1),
            ("template_version", 1),
        ],
    )

    # A user may receive a particular template version
    # only once.
    # A user may receive a template family only once,
    # independently of template version.
    db.cases.create_index(
        [
            ("owner_id", 1),
            ("template_key", 1),
        ],
        unique=True,
        partialFilterExpression={
            "owner_id": {
                "$type": "string",
            },
            "template_key": {
                "$type": "string",
            },
            "is_template": False,
        },
        name="unique_user_template_key",
    )

    db.cases.create_index(
        [
            ("is_template", 1),
            ("is_active_template", 1),
            ("template_key", 1),
            ("template_version", 1),
        ],
        name="template_lookup",
    )

    # Nodes
    db.nodes.create_index(
        "id",
        unique=True,
    )

    db.nodes.create_index(
        "case_id",
    )

    # Edges
    db.edges.create_index(
        "id",
        unique=True,
    )

    db.edges.create_index(
        "case_id",
    )

    db.edges.create_index(
        "source_id",
    )

    db.edges.create_index(
        "target_id",
    )

    # Actors
    db.actors.create_index(
        "id",
        unique=True,
    )

    db.actors.create_index(
        "case_id",
    )

    # Artifacts
    db.artifacts.create_index(
        "id",
        unique=True,
    )

    db.artifacts.create_index(
        "case_id",
    )

    # Law embeddings
    db.law_embeddings.create_index(
        "id",
        unique=True,
    )

    db.law_embeddings.create_index(
        "law",
    )

    db.law_embeddings.create_index(
        "paragraph",
    )

    db.law_embeddings.create_index(
        "doc_key",
        unique=True,
    )