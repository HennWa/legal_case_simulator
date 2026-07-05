from backend.database.mongo import db
from backend.object_graph_runtime.graph_classes import Case

class CaseRepository:

    def __init__(self):
        self.collection = db["cases"]

    def create(self, case: Case):

        self.collection.insert_one(
            case.model_dump()
        )

    def get(self, case_id: str) -> Case | None:

        data = self.collection.find_one(
            {"id": case_id}
        )

        if not data:
            return None

        data.pop("_id", None)

        return Case.model_validate(data)

    def update(self, case: Case):

        self.collection.replace_one(
            {"id": case.id},
            case.model_dump()
        )

    def upsert(self, case: Case):
        self.collection.replace_one(
            {"id": case.id},
            case.model_dump(),
            upsert=True
        )

    def delete(self, case_id: str):

        self.collection.delete_one(
            {"id": case_id}
        )