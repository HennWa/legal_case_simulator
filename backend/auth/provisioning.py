# backend/auth/provisioning.py

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from backend.auth.models import (
    User,
    UserRole,
)
from backend.database.repositories.user_repository import (
    UserRepository,
)


AUTH0_CLAIM_NAMESPACE = (
    "https://casendra.legal"
)

AUTH0_EMAIL_CLAIM = (
    f"{AUTH0_CLAIM_NAMESPACE}/email"
)

AUTH0_EMAIL_VERIFIED_CLAIM = (
    f"{AUTH0_CLAIM_NAMESPACE}/email_verified"
)

AUTH0_NAME_CLAIM = (
    f"{AUTH0_CLAIM_NAMESPACE}/name"
)


def _get_required_string_claim(
    payload: dict[str, Any],
    claim_name: str,
) -> str:
    value = payload.get(
        claim_name
    )

    if (
        not isinstance(value, str)
        or not value.strip()
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "The authenticated identity "
                "does not provide all information "
                "required to create a Casendra account."
            ),
        )

    return value.strip()


def provision_auth0_user(
    *,
    payload: dict[str, Any],
    repository: UserRepository,
) -> User:
    """
    Create a local Casendra account for a valid
    Auth0 identity.

    The function must only receive an already
    validated Auth0 access-token payload.
    """

    auth0_subject = (
        _get_required_string_claim(
            payload,
            "sub",
        )
    )

    email = (
        _get_required_string_claim(
            payload,
            AUTH0_EMAIL_CLAIM,
        )
    )

    email_verified = payload.get(
        AUTH0_EMAIL_VERIFIED_CLAIM
    )

    if email_verified is not True:
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "A verified email address is "
                "required to create a Casendra account."
            ),
        )

    if "@" not in email:
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "The authenticated identity "
                "does not contain a valid email address."
            ),
        )

    # --------------------------------------------------
    # The Auth0 identity may already have been created
    # by another request.
    # --------------------------------------------------

    existing_user = (
        repository.get_by_auth0_subject(
            auth0_subject
        )
    )

    if existing_user is not None:
        return existing_user

    # --------------------------------------------------
    # Never silently link by email.
    #
    # auth0_subject is the authoritative identity link.
    # An existing email with another / missing Auth0
    # subject therefore requires explicit resolution.
    # --------------------------------------------------

    existing_email_user = (
        repository.get_by_email(
            email
        )
    )

    if existing_email_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A Casendra account already exists "
                "for this email address but is linked "
                "to a different identity."
            ),
        )

    display_name = payload.get(
        AUTH0_NAME_CLAIM
    )

    if not isinstance(
        display_name,
        str,
    ):
        display_name = ""

    display_name = (
        display_name.strip()
    )

    if not display_name:
        display_name = (
            email.split(
                "@",
                maxsplit=1,
            )[0]
        )

    # --------------------------------------------------
    # Security-critical defaults.
    #
    # New users can NEVER select their role themselves.
    # --------------------------------------------------

    user = User.create(
        email=email,
        display_name=display_name,
        auth0_subject=auth0_subject,
        role=UserRole.USER,
        is_active=True,
        is_verified=True,
    )

    try:
        return repository.create(
            user
        )

    except DuplicateKeyError:
        # ----------------------------------------------
        # Handles concurrent first requests.
        #
        # Example:
        # two /auth/me requests arrive at almost the
        # same moment after the first login.
        # ----------------------------------------------

        existing_user = (
            repository.get_by_auth0_subject(
                auth0_subject
            )
        )

        if existing_user is not None:
            return existing_user

        existing_email_user = (
            repository.get_by_email(
                email
            )
        )

        if existing_email_user is not None:
            raise HTTPException(
                status_code=(
                    status.HTTP_409_CONFLICT
                ),
                detail=(
                    "A Casendra account already "
                    "exists for this email address "
                    "but is linked to a different "
                    "identity."
                ),
            )

        raise