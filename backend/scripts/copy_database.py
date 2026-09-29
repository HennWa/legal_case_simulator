# backend/scripts/copy_database.py

from __future__ import annotations

import argparse
from copy import deepcopy

from pymongo import MongoClient
from pymongo.database import Database


DEFAULT_SOURCE_DATABASE = "legal_case_simulator_dev"
DEFAULT_TARGET_DATABASE = "legal_case_simulator"

BATCH_SIZE = 1000


def copy_collection(
    source_db: Database,
    target_db: Database,
    collection_name: str,
    *,
    drop_target: bool,
) -> None:
    """
    Copy one MongoDB collection including:
      - documents
      - normal MongoDB indexes

    Atlas Search / Vector Search indexes are NOT copied here.
    """

    source_collection = source_db[collection_name]
    target_collection = target_db[collection_name]

    source_count = source_collection.count_documents({})

    print()
    print(f"Collection: {collection_name}")
    print(f"  Source documents: {source_count}")

    if drop_target:
        print("  Dropping target collection...")
        target_collection.drop()

    # --------------------------------------------------
    # Copy documents
    # --------------------------------------------------

    print("  Copying documents...")

    batch = []
    copied = 0

    cursor = source_collection.find({})

    for document in cursor:
        batch.append(document)

        if len(batch) >= BATCH_SIZE:
            target_collection.insert_many(
                batch,
                ordered=False,
            )

            copied += len(batch)

            print(
                f"    copied {copied}/{source_count}"
            )

            batch = []

    if batch:
        target_collection.insert_many(
            batch,
            ordered=False,
        )

        copied += len(batch)

    print(f"  Documents copied: {copied}")

    # --------------------------------------------------
    # Copy indexes
    # --------------------------------------------------

    print("  Copying indexes...")

    indexes = list(
        source_collection.list_indexes()
    )

    for index in indexes:

        # MongoDB automatically creates the _id index.
        if index["name"] == "_id_":
            continue

        index_definition = deepcopy(index)

        keys = index_definition.pop("key")
        index_definition.pop("v", None)
        index_definition.pop("ns", None)

        name = index_definition.pop(
            "name",
            None,
        )

        target_collection.create_index(
            list(keys.items()),
            name=name,
            **index_definition,
        )

        print(f"    {name}")

    target_count = target_collection.count_documents({})

    if target_count != source_count:
        raise RuntimeError(
            f"Verification failed for {collection_name}: "
            f"source={source_count}, "
            f"target={target_count}"
        )

    print("  Verification: OK")


def copy_database(
    uri: str,
    source_database: str,
    target_database: str,
    *,
    drop_target: bool,
) -> None:

    if source_database == target_database:
        raise ValueError(
            "Source and target database must be different."
        )

    client = MongoClient(uri)

    try:
        print("Connecting to MongoDB...")
        client.admin.command("ping")
        print("Connection successful.")

        source_db = client[source_database]
        target_db = client[target_database]

        collections = source_db.list_collection_names()

        # Ignore MongoDB internal collections.
        collections = [
            name
            for name in collections
            if not name.startswith("system.")
        ]

        if not collections:
            raise RuntimeError(
                f"Source database "
                f"{source_database!r} contains no collections."
            )

        print()
        print("======================================")
        print("MongoDB database migration")
        print("======================================")
        print(f"Source: {source_database}")
        print(f"Target: {target_database}")
        print()
        print("Collections:")

        for name in collections:
            print(f"  - {name}")

        print()

        confirmation = input(
            f"Copy ALL collections from "
            f"{source_database!r} to "
            f"{target_database!r}? "
            f"Type 'COPY' to continue: "
        )

        if confirmation != "COPY":
            print("Migration cancelled.")
            return

        for collection_name in collections:
            copy_collection(
                source_db,
                target_db,
                collection_name,
                drop_target=drop_target,
            )

        print()
        print("======================================")
        print("Migration completed successfully")
        print("======================================")

        print()
        print("Final document counts:")

        for collection_name in collections:

            source_count = (
                source_db[collection_name]
                .count_documents({})
            )

            target_count = (
                target_db[collection_name]
                .count_documents({})
            )

            print(
                f"  {collection_name}: "
                f"{source_count} -> {target_count}"
            )

    finally:
        client.close()


def main() -> None:

    parser = argparse.ArgumentParser(
        description=(
            "Copy the Casendra development MongoDB "
            "database to the production database."
        )
    )

    parser.add_argument(
        "--uri",
        required=True,
        help=(
            "MongoDB URI of a user that has access "
            "to both source and target databases."
        ),
    )

    parser.add_argument(
        "--source",
        default=DEFAULT_SOURCE_DATABASE,
        help="Source database.",
    )

    parser.add_argument(
        "--target",
        default=DEFAULT_TARGET_DATABASE,
        help="Target database.",
    )

    parser.add_argument(
        "--drop-target",
        action="store_true",
        help=(
            "Drop target collections before copying. "
            "Recommended for the initial production migration."
        ),
    )

    args = parser.parse_args()

    copy_database(
        uri=args.uri,
        source_database=args.source,
        target_database=args.target,
        drop_target=args.drop_target,
    )


if __name__ == "__main__":
    main()