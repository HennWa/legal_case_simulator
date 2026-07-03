from typing import Any

from pymongo import ReplaceOne
from pymongo.collection import Collection

from backend.database.mongo import db


class VectorRepository:
    """
    Repository for legal text embeddings stored in MongoDB Atlas.
    """

    def __init__(self):
        self.collection: Collection = db["law_embeddings"]

    @staticmethod
    def document_to_mongo_doc(document, embedding: list[float]) -> dict[str, Any]:
        """
        Converts a LangChain Document into a MongoDB document.
        """

        md = document.metadata

        return {
            # Stable id used for upserts
            "id": md["doc_key"],

            # Keep the original UUID if desired
            "uuid": document.id,

            # Vector search fields
            "text": document.page_content,
            "embedding": embedding,

            # Metadata
            "law": md["law"],
            "book": md["book"],
            "section": md["section"],
            "title": md["title"],
            "subtitle": md["subtitle"],
            "paragraph": md["paragraph"],
            "heading": md["heading"],
            "paragraph_title": md["paragraph_title"],
            "absatz": md["absatz"],
            "chunk": md["chunk"],
            "source_file": md["source_file"],
            "source_type": md["source_type"],
            "doc_key": md["doc_key"],
        }

    def insert_batch(self, docs: list[dict]) -> None:
        """
        Inserts a batch of new documents.
        Fails on duplicate ids.
        """

        if not docs:
            return

        self.collection.insert_many(
            docs,
            ordered=False,
        )

    def upsert_batch(self, docs: list[dict]) -> None:
        """
        Inserts new documents and updates existing ones.
        Safe to run multiple times.
        """

        if not docs:
            return

        operations = [
            ReplaceOne(
                {"id": doc["id"]},
                doc,
                upsert=True,
            )
            for doc in docs
        ]

        self.collection.bulk_write(
            operations,
            ordered=False,
        )

    def delete_all(self) -> None:
        """
        Deletes the complete collection contents.
        Useful for rebuilding the vector store.
        """

        self.collection.delete_many({})

    def count(self) -> int:
        """
        Returns the number of stored vectors.
        """

        return self.collection.count_documents({})

    def find_by_doc_key(self, doc_key: str) -> dict | None:
        """
        Returns one document by its doc_key.
        """

        return self.collection.find_one({"doc_key": doc_key})

    def find_by_id(self, id: str) -> dict | None:
        """
        Returns one document by its stable id.
        """

        return self.collection.find_one({"id": id})