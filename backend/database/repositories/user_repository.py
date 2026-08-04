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
        self.collection: Collection = db["users"]

    @staticmethod
    def _document_to_user(
        document: dict | None,
    ) -> User | None:
        if document is None:
            return None

        document = dict(document)
        document.pop("_id", None)

        return User.model_validate(document)

    def create(self, user: User) -> User:
        document = user.model_dump(
            exclude_none=True,
        )

        self.collection.insert_one(document)

        return user

    def get(self, user_id: str) -> User | None:
        document = self.collection.find_one(
            {"id": user_id}
        )

        return self._document_to_user(document)

    def get_by_email(
        self,
        email: str,
    ) -> User | None:
        document = self.collection.find_one(
            {
                "email_normalized": (
                    email.strip().lower()
                )
            }
        )

        return self._document_to_user(document)

    def get_by_auth0_subject(
        self,
        auth0_subject: str,
    ) -> User | None:
        document = self.collection.find_one(
            {"auth0_subject": auth0_subject}
        )

        return self._document_to_user(document)

    def update(self, user: User) -> User:
        now = utc_now()

        document = user.model_dump(
            exclude_none=True,
        )

        document["updated_at"] = now

        result = self.collection.replace_one(
            {"id": user.id},
            document,
        )

        if result.matched_count == 0:
            raise LookupError(
                f"User {user.id!r} does not exist."
            )

        return User.model_validate(document)

    def upsert(self, user: User) -> User:
        now = utc_now()

        document = user.model_dump(
            exclude_none=True,
        )

        # created_at must only be set when the document is inserted.
        created_at = document.pop(
            "created_at",
            user.created_at,
        )

        document["updated_at"] = now

        stored_document = (
            self.collection.find_one_and_update(
                {"id": user.id},
                {
                    "$set": document,
                    "$setOnInsert": {
                        "created_at": created_at,
                    },
                },
                upsert=True,
                return_document=ReturnDocument.AFTER,
            )
        )

        stored_user = self._document_to_user(
            stored_document
        )

        if stored_user is None:
            raise RuntimeError(
                f"Failed to upsert user {user.id!r}."
            )

        return stored_user

    def set_last_login(
        self,
        user_id: str,
    ) -> User:
        now = utc_now()

        stored_document = (
            self.collection.find_one_and_update(
                {"id": user_id},
                {
                    "$set": {
                        "last_login_at": now,
                        "updated_at": now,
                    }
                },
                return_document=ReturnDocument.AFTER,
            )
        )

        user = self._document_to_user(
            stored_document
        )

        if user is None:
            raise LookupError(
                f"User {user_id!r} does not exist."
            )

        return user

    def delete(self, user_id: str) -> bool:
        result = self.collection.delete_one(
            {"id": user_id}
        )

        return result.deleted_count == 1