from backend.database.mongo import db
from backend.object_graph_runtime.graph_classes import Artifact

class ArtifactRepository:

    def __init__(self):
        self.collection = db["artifacts"]

    def create(self, artifact: Artifact):

        self.collection.insert_one(
            artifact.model_dump()
        )

    def get(self, artifact_id: str) -> Artifact | None:

        data = self.collection.find_one(
            {"id": artifact_id}
        )

        if not data:
            return None

        data.pop("_id", None)

        return Artifact.model_validate(data)

    def update(self, artifact: Artifact):

        self.collection.replace_one(
            {"id": artifact.id},
            artifact.model_dump()
        )

    def upsert(self, artifact: Artifact):
        self.collection.replace_one(
            {"id": artifact.id},
            artifact.model_dump(),
            upsert=True
        )

    def delete(self, artifact_id: str):

        self.collection.delete_one(
            {"id": artifact_id}
        )

    def delete_by_case(self, case_id: str):

        self.collection.delete_many(
            {"case_id": case_id}
        )

    def get_by_case(self, case_id: str):
        docs = self.collection.find(
            {"case_id": case_id}
        )

        return [
            Artifact.model_validate(
                {k: v for k, v in doc.items() if k != "_id"}
            )
            for doc in docs
        ]