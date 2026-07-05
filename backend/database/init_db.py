# database/init_db.py

# Create indexes in db. Script can be called any time a client is build since Mong DB
# cannot duplicate indices

from backend.database.mongo import db

def create_indexes():

    db.nodes.create_index(
        "id",
        unique=True
    )

    db.nodes.create_index(
        "case_id"
    )

    db.edges.create_index(
        "id",
        unique=True
    )

    db.edges.create_index(
        "case_id"
    )

    db.edges.create_index(
        "source_id"
    )

    db.edges.create_index(
        "target_id"
    )

    db.actors.create_index(
        "id",
        unique=True
    )

    db.actors.create_index(
        "case_id"
    )

    db.cases.create_index(
        "id",
        unique=True
    )

    db.law_embeddings.create_index("id", unique=True)

    db.law_embeddings.create_index("law")

    db.law_embeddings.create_index("paragraph")

    db.law_embeddings.create_index("doc_key", unique=True)