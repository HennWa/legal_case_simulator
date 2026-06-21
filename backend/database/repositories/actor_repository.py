from database.mongo import db
from object_graph_runtime.graph_classes import Actor

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

    def delete(self, actor_id: str):

        self.collection.delete_one(
            {"id": actor_id}
        )