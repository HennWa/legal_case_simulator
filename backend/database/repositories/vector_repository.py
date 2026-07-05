from typing import Any

from pymongo import ReplaceOne
from pymongo.collection import Collection
from langchain_core.documents import Document
from openai import OpenAI

from backend.database.mongo import db


class VectorRepository:
    """
    Repository for legal text embeddings stored in MongoDB Atlas.
    """

    def __init__(
        self,
        embedding_model: str = "text-embedding-3-small",
        index_name: str = "law_vector_index",
    ):
        self.collection = db["law_embeddings"]
        self.index_name = index_name

        self.client = OpenAI()
        self.embedding_model = embedding_model

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

    def search(self, query: str, k: int = 7, filters: dict | None = None) -> list[Document]:
        """
        Performs a semantic vector search in MongoDB Atlas.

        Parameters
        ----------
        query
            Natural language search query.

        k
            Number of documents to return.

        filters
            Optional metadata filters, e.g.

            {
                "law": "BGB",
                "paragraph": "823"
            }
        """

        response = self.client.embeddings.create(
            model=self.embedding_model,
            input=query,
        )

        query_embedding = response.data[0].embedding

        vector_search = {
            "index": self.index_name,
            "path": "embedding",
            "queryVector": query_embedding,
            "numCandidates": max(100, k * 20),
            "limit": k,
        }

        #
        # Optional metadata filters
        #

        if filters:

            vector_search["filter"] = {
                key: value
                for key, value in filters.items()
            }

        pipeline = [
            {
                "$vectorSearch": vector_search
            },
            {
                "$project": {
                    "_id": 0,
                    "score": {"$meta": "vectorSearchScore"},
                    "text": 1,
                    "law": 1,
                    "book": 1,
                    "section": 1,
                    "title": 1,
                    "subtitle": 1,
                    "paragraph": 1,
                    "heading": 1,
                    "paragraph_title": 1,
                    "absatz": 1,
                    "chunk": 1,
                    "source_file": 1,
                    "source_type": 1,
                    "doc_key": 1,
                }
            }
        ]

        results = list(
            self.collection.aggregate(pipeline)
        )

        documents = []

        for doc in results:

            documents.append(
                Document(
                    id=doc["doc_key"],
                    page_content=doc["text"],
                    metadata={
                        "score": doc["score"],
                        "law": doc["law"],
                        "book": doc["book"],
                        "section": doc["section"],
                        "title": doc["title"],
                        "subtitle": doc["subtitle"],
                        "paragraph": doc["paragraph"],
                        "heading": doc["heading"],
                        "paragraph_title": doc["paragraph_title"],
                        "absatz": doc["absatz"],
                        "chunk": doc["chunk"],
                        "source_file": doc["source_file"],
                        "source_type": doc["source_type"],
                        "doc_key": doc["doc_key"],
                    },
                )
            )

        return documents