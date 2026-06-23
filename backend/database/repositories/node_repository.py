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

    def upsert(self, node: LegalNode):
        self.collection.replace_one(
            {"id": node.id},
            node.model_dump(),
            upsert=True
        )

    def delete(self, node_id: str):

        self.collection.delete_one(
            {"id": node_id}
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
            LegalNode.model_validate(
                {k: v for k, v in doc.items() if k != "_id"}
            )
            for doc in docs
        ]