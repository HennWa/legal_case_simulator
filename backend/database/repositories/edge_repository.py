from backend.database.mongo import db
from backend.object_graph_runtime.graph_classes import LegalEdge

class EdgeRepository:

    def __init__(self):
        self.collection = db["edges"]

    def create(self, edge: LegalEdge):

        self.collection.insert_one(
            edge.model_dump()
        )

    def get(self, edge_id: str) -> LegalEdge | None:

        data = self.collection.find_one(
            {"id": edge_id}
        )

        if not data:
            return None

        data.pop("_id", None)

        return LegalEdge.model_validate(data)

    def update(self, edge: LegalEdge):

        self.collection.replace_one(
            {"id": edge.id},
            edge.model_dump()
        )

    def upsert(self, edge: LegalEdge):
        self.collection.replace_one(
            {"id": edge.id},
            edge.model_dump(),
            upsert=True
        )

    def delete(self, edge_id: str):

        self.collection.delete_one(
            {"id": edge_id}
        )

    def delete_by_case(self, case_id: str):

        self.collection.delete_one(
            {"case_id": case_id}
        )

    def get_by_case(self, case_id: str):
        docs = self.collection.find(
            {"case_id": case_id}
        )

        return [
            LegalEdge.model_validate(
                {k: v for k, v in doc.items() if k != "_id"}
            )
            for doc in docs
        ]
