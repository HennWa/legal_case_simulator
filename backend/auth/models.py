# backend/auth/models.py

from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_user_id() -> str:
    return f"usr_{uuid4().hex}"


class UserRole(StrEnum):
    USER = "user"
    ADMIN = "admin"


class User(BaseModel):
    """
    Local Casendra application user.

    Authentication credentials are not stored in this model. When Auth0 is
    enabled, auth0_subject links this local user to the Auth0 identity.
    """

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    id: str = Field(default_factory=create_user_id)

    # Stable Auth0 identity, for example "auth0|abc123".
    # It remains None for local development and test users.
    auth0_subject: str | None = None

    email: str
    email_normalized: str

    display_name: str = ""

    role: UserRole = UserRole.USER

    is_active: bool = True
    is_verified: bool = False

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    last_login_at: datetime | None = None

    @field_validator("id")
    @classmethod
    def validate_id(cls, value: str) -> str:
        if not value:
            raise ValueError("User ID must not be empty.")

        if not value.startswith("usr_"):
            raise ValueError(
                "User ID must begin with 'usr_'."
            )

        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Email must not be empty.")

        if "@" not in value:
            raise ValueError(
                "Email must contain an '@' character."
            )

        return value

    @field_validator("email_normalized")
    @classmethod
    def validate_normalized_email(cls, value: str) -> str:
        normalized = value.strip().lower()

        if not normalized:
            raise ValueError(
                "Normalized email must not be empty."
            )

        if "@" not in normalized:
            raise ValueError(
                "Normalized email must contain an '@' character."
            )

        return normalized

    @classmethod
    def create(
        cls,
        *,
        email: str,
        display_name: str = "",
        auth0_subject: str | None = None,
        user_id: str | None = None,
        role: UserRole = UserRole.USER,
        is_active: bool = True,
        is_verified: bool = False,
    ) -> "User":
        normalized_email = email.strip().lower()

        return cls(
            id=user_id or create_user_id(),
            auth0_subject=auth0_subject,
            email=email.strip(),
            email_normalized=normalized_email,
            display_name=display_name.strip(),
            role=role,
            is_active=is_active,
            is_verified=is_verified,
        )


class CurrentUserResponse(BaseModel):
    """
    Safe representation returned to the frontend.

    Internal database fields that are not needed by the frontend should not
    be exposed through this response.
    """

    id: str
    email: str
    display_name: str
    role: UserRole
    is_active: bool
    is_verified: bool