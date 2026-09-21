from backend.database.mongo import db
from backend.object_graph_runtime.graph_classes import (
    Case,
)


class CaseRepository:

    def __init__(self):
        self.collection = db["cases"]

    # =========================================================
    # Create
    # =========================================================

    def create(
        self,
        case: Case,
    ):
        self.collection.insert_one(
            case.model_dump()
        )

    # =========================================================
    # Get by ID
    # =========================================================

    def get(
        self,
        case_id: str,
    ) -> Case | None:

        data = self.collection.find_one(
            {"id": case_id}
        )

        if not data:
            return None

        data.pop("_id", None)

        return Case.model_validate(
            data
        )

    # =========================================================
    # Update
    # =========================================================

    def update(
        self,
        case: Case,
    ):
        self.collection.replace_one(
            {"id": case.id},
            case.model_dump(),
        )

    # =========================================================
    # Upsert
    # =========================================================

    def upsert(
        self,
        case: Case,
    ):
        self.collection.replace_one(
            {"id": case.id},
            case.model_dump(),
            upsert=True,
        )

    # =========================================================
    # Delete
    # =========================================================

    def delete(
        self,
        case_id: str,
    ):
        self.collection.delete_one(
            {"id": case_id}
        )

    # =========================================================
    # Get cases by owner
    # =========================================================

    def get_by_owner_id(
        self,
        owner_id: str,
    ) -> list[Case]:

        docs = self.collection.find(
            {
                "owner_id": owner_id,
                "is_template": {
                    "$ne": True,
                },
            }
        )

        return [
            Case.model_validate(
                {
                    k: v
                    for k, v in doc.items()
                    if k != "_id"
                }
            )
            for doc in docs
        ]

    # =========================================================
    # Get canonical template
    # =========================================================

    def get_template(
        self,
        template_key: str,
        template_version: int | None = None,
    ) -> Case | None:

        query = {
            "is_template": True,
            "template_key": template_key,
        }

        if template_version is not None:
            query["template_version"] = (
                template_version
            )

        data = self.collection.find_one(
            query
        )

        if not data:
            return None

        data.pop("_id", None)

        return Case.model_validate(
            data
        )

    # =========================================================
    # Get user's copy of a template
    # =========================================================

    def get_user_template_copy(
        self,
        owner_id: str,
        template_key: str,
        template_version: int,
    ) -> Case | None:

        data = self.collection.find_one(
            {
                "owner_id": owner_id,
                "is_template": {
                    "$ne": True,
                },
                "template_key": (
                    template_key
                ),
                "template_version": (
                    template_version
                ),
            }
        )

        if not data:
            return None

        data.pop("_id", None)

        return Case.model_validate(
            data
        )