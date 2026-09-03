# backend/database/repositories/user_repository.py

from __future__ import annotations

from datetime import datetime, timezone

from pymongo import ReturnDocument
from pymongo.collection import Collection

from backend.auth.models import User
from backend.database.mongo import db


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRepository:
    def __init__(self) -> None:
        self.collection: Collection = (
            db["users"]
        )

    @staticmethod
    def _document_to_user(
        document: dict | None,
    ) -> User | None:
        if document is None:
            return None

        document = dict(document)
        document.pop("_id", None)

        return User.model_validate(
            document
        )

    def create(
        self,
        user: User,
    ) -> User:
        document = user.model_dump(
            exclude_none=True,
        )

        self.collection.insert_one(
            document
        )

        return user

    def get(
        self,
        user_id: str,
    ) -> User | None:
        document = (
            self.collection.find_one(
                {"id": user_id}
            )
        )

        return self._document_to_user(
            document
        )

    def get_by_email(
        self,
        email: str,
    ) -> User | None:
        document = (
            self.collection.find_one(
                {
                    "email_normalized": (
                        email.strip().lower()
                    )
                }
            )
        )

        return self._document_to_user(
            document
        )

    def get_by_auth0_subject(
        self,
        auth0_subject: str,
    ) -> User | None:
        document = (
            self.collection.find_one(
                {
                    "auth0_subject":
                        auth0_subject
                }
            )
        )

        return self._document_to_user(
            document
        )

    def update(
        self,
        user: User,
    ) -> User:
        now = utc_now()

        document = user.model_dump(
            exclude_none=True,
        )

        document["updated_at"] = now

        result = (
            self.collection.replace_one(
                {"id": user.id},
                document,
            )
        )

        if result.matched_count == 0:
            raise LookupError(
                f"User {user.id!r} "
                f"does not exist."
            )

        return User.model_validate(
            document
        )

    def upsert(
        self,
        user: User,
    ) -> User:
        now = utc_now()

        document = user.model_dump(
            exclude_none=True,
        )

        # created_at must only be set when the
        # document is inserted.
        created_at = document.pop(
            "created_at",
            user.created_at,
        )

        document["updated_at"] = now

        stored_document = (
            self.collection
            .find_one_and_update(
                {"id": user.id},
                {
                    "$set": document,
                    "$setOnInsert": {
                        "created_at":
                            created_at,
                    },
                },
                upsert=True,
                return_document=(
                    ReturnDocument.AFTER
                ),
            )
        )

        stored_user = (
            self._document_to_user(
                stored_document
            )
        )

        if stored_user is None:
            raise RuntimeError(
                f"Failed to upsert "
                f"user {user.id!r}."
            )

        return stored_user

    def set_last_login(
        self,
        user_id: str,
    ) -> User:
        now = utc_now()

        stored_document = (
            self.collection
            .find_one_and_update(
                {"id": user_id},
                {
                    "$set": {
                        "last_login_at": now,
                        "updated_at": now,
                    }
                },
                return_document=(
                    ReturnDocument.AFTER
                ),
            )
        )

        user = self._document_to_user(
            stored_document
        )

        if user is None:
            raise LookupError(
                f"User {user_id!r} "
                f"does not exist."
            )

        return user

    def reserve_node_creation(
        self,
        user_id: str,
        *,
        default_limit: int,
        unlimited: bool = False,
    ) -> User | None:
        """
        Atomically reserve one node creation.

        For normal users the MongoDB query performs
        both operations atomically:

            1. verify that nodes_created < effective limit
            2. increment nodes_created by one

        The effective limit is:

            user.node_limit
                if it exists and is not None

            otherwise

            default_limit

        This is intentionally implemented with MongoDB
        $ifNull so old user documents work even if they
        contain neither nodes_created nor node_limit.

        Admins call this with unlimited=True. Their node
        creation is still counted, but no quota condition
        is applied.
        """

        now = utc_now()

        query: dict = {
            "id": user_id,
        }

        if not unlimited:
            query["$expr"] = {
                "$lt": [
                    {
                        "$ifNull": [
                            "$nodes_created",
                            0,
                        ]
                    },
                    {
                        "$ifNull": [
                            "$node_limit",
                            default_limit,
                        ]
                    },
                ]
            }

        stored_document = (
            self.collection
            .find_one_and_update(
                query,
                {
                    "$inc": {
                        "nodes_created": 1,
                    },
                    "$set": {
                        "updated_at": now,
                    },
                },
                return_document=(
                    ReturnDocument.AFTER
                ),
            )
        )

        return self._document_to_user(
            stored_document
        )

    def release_node_creation(
        self,
        user_id: str,
    ) -> User | None:
        """
        Roll back a previously reserved node.

        This should only be used when node creation fails
        technically after the quota was reserved.

        It must NOT be called when a user later deletes
        a successfully created node. The quota tracks
        consumed node creations, not currently existing
        nodes.
        """

        now = utc_now()

        stored_document = (
            self.collection
            .find_one_and_update(
                {
                    "id": user_id,
                    "nodes_created": {
                        "$gt": 0,
                    },
                },
                {
                    "$inc": {
                        "nodes_created": -1,
                    },
                    "$set": {
                        "updated_at": now,
                    },
                },
                return_document=(
                    ReturnDocument.AFTER
                ),
            )
        )

        return self._document_to_user(
            stored_document
        )

    def delete(
        self,
        user_id: str,
    ) -> bool:
        result = (
            self.collection.delete_one(
                {"id": user_id}
            )
        )

        return (
            result.deleted_count == 1
        )