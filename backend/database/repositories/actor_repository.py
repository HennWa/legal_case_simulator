from backend.database.mongo import db
from backend.object_graph_runtime.graph_classes import Actor

class ActorRepository:

    def __init__(self):
        self.collection = db["actors"]

    def create(self, actor: Actor):

        self.collection.insert_one(
            actor.model_dump()
        )

    def get(self, actor_id: str) -> Actor | None:

        data = self.collection.find_one(
            {"id": actor_id}
        )

        if not data:
            return None

        data.pop("_id", None)

        return Actor.model_validate(data)

    def update(self, actor: Actor):

        self.collection.replace_one(
            {"id": actor.id},
            actor.model_dump()
        )

    def upsert(self, actor: Actor):
        self.collection.replace_one(
            {"id": actor.id},
            actor.model_dump(),
            upsert=True
        )

    def delete(self, actor_id: str):

        self.collection.delete_one(
            {"id": actor_id}
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
            Actor.model_validate(
                {k: v for k, v in doc.items() if k != "_id"}
            )
            for doc in docs
        ]
