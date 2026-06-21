from database.mongo import db
from object_graph_runtime.graph_classes import LegalEdge

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

    def delete(self, edge_id: str):

        self.collection.delete_one(
            {"id": edge_id}
        )