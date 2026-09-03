# backend/auth/models.py

from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum
from uuid import uuid4

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


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

    Node usage:
        nodes_created
            Number of successfully created nodes counted against the user's
            usage quota. Existing users without this database field start
            at zero.

        node_limit
            Optional per-user override. None means that the application-wide
            NODE_LIMIT_DEFAULT is used.

            Admin users are unlimited independently of this value.
    """

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    id: str = Field(
        default_factory=create_user_id
    )

    # Stable Auth0 identity, for example "auth0|abc123".
    # It remains None for local development and test users.
    auth0_subject: str | None = None

    email: str
    email_normalized: str

    display_name: str = ""

    role: UserRole = UserRole.USER

    is_active: bool = True
    is_verified: bool = False

    # --------------------------------------------------
    # Usage limits
    # --------------------------------------------------

    # Existing MongoDB users do not need to have this
    # field. Pydantic will use zero if it is missing.
    nodes_created: int = Field(
        default=0,
        ge=0,
    )

    # None means:
    # use settings.node_limit_default.
    #
    # A concrete integer overrides the global limit for
    # this individual user.
    node_limit: int | None = Field(
        default=None,
        ge=0,
    )

    created_at: datetime = Field(
        default_factory=utc_now
    )

    updated_at: datetime = Field(
        default_factory=utc_now
    )

    last_login_at: datetime | None = None

    @field_validator("id")
    @classmethod
    def validate_id(
        cls,
        value: str,
    ) -> str:
        if not value:
            raise ValueError(
                "User ID must not be empty."
            )

        if not value.startswith("usr_"):
            raise ValueError(
                "User ID must begin with 'usr_'."
            )

        return value

    @field_validator("email")
    @classmethod
    def validate_email(
        cls,
        value: str,
    ) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Email must not be empty."
            )

        if "@" not in value:
            raise ValueError(
                "Email must contain an '@' character."
            )

        return value

    @field_validator("email_normalized")
    @classmethod
    def validate_normalized_email(
        cls,
        value: str,
    ) -> str:
        normalized = (
            value.strip().lower()
        )

        if not normalized:
            raise ValueError(
                "Normalized email must not be empty."
            )

        if "@" not in normalized:
            raise ValueError(
                "Normalized email must contain "
                "an '@' character."
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
        normalized_email = (
            email.strip().lower()
        )

        return cls(
            id=user_id or create_user_id(),
            auth0_subject=auth0_subject,
            email=email.strip(),
            email_normalized=(
                normalized_email
            ),
            display_name=(
                display_name.strip()
            ),
            role=role,
            is_active=is_active,
            is_verified=is_verified,
        )


class CurrentUserResponse(BaseModel):
    """
    Safe representation returned to the frontend.

    node_limit is the effective limit, not necessarily
    the raw per-user override.

    For admins:
        node_limit = None
        nodes_remaining = None

    because admins have unlimited node creation.
    """

    id: str
    email: str
    display_name: str
    role: UserRole
    is_active: bool
    is_verified: bool

    nodes_created: int
    node_limit: int | None
    nodes_remaining: int | None