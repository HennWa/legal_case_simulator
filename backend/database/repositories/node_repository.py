from database.mongo import db
from object_graph_runtime.graph_classes import LegalNode

class NodeRepository:

    def __init__(self):
        self.collection = db["nodes"]

    def create(self, node: LegalNode):

        self.collection.insert_one(
            node.model_dump()
        )

    def get(self, node_id: str) -> LegalNode | None:

        data = self.collection.find_one(
            {"id": node_id}
        )

        if not data:
            return None

        data.pop("_id", None)

        return LegalNode.model_validate(data)

    def update(self, node: LegalNode):

        self.collection.replace_one(
            {"id": node.id},
            node.model_dump()
        )

    def delete(self, node_id: str):

        self.collection.delete_one(
            {"id": node_id}
        )