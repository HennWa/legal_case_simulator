# backend/tests/auth/test_provisioning.py

import pytest

from fastapi import HTTPException

from backend.auth.models import (
    User,
    UserRole,
)
from backend.auth.provisioning import (
    AUTH0_EMAIL_CLAIM,
    AUTH0_EMAIL_VERIFIED_CLAIM,
    AUTH0_NAME_CLAIM,
    provision_auth0_user,
)


class FakeUserRepository:
    def __init__(
        self,
        users: list[User] | None = None,
    ):
        self.users = list(
            users or []
        )

    def get_by_auth0_subject(
        self,
        auth0_subject: str,
    ):
        for user in self.users:
            if (
                user.auth0_subject
                == auth0_subject
            ):
                return user

        return None

    def get_by_email(
        self,
        email: str,
    ):
        email_normalized = (
            email.strip().lower()
        )

        for user in self.users:
            if (
                user.email_normalized
                == email_normalized
            ):
                return user

        return None

    def create(
        self,
        user: User,
    ):
        self.users.append(
            user
        )

        return user


def create_payload(
    *,
    subject: str = (
        "auth0|new-user"
    ),
    email: str = (
        "new@example.com"
    ),
    email_verified: bool = True,
    name: str = "New User",
):
    return {
        "sub": subject,

        AUTH0_EMAIL_CLAIM:
            email,

        AUTH0_EMAIL_VERIFIED_CLAIM:
            email_verified,

        AUTH0_NAME_CLAIM:
            name,
    }


def test_new_verified_user_is_created():
    repository = (
        FakeUserRepository()
    )

    payload = create_payload()

    user = provision_auth0_user(
        payload=payload,
        repository=repository,
    )

    assert (
        user.auth0_subject
        == "auth0|new-user"
    )

    assert (
        user.email
        == "new@example.com"
    )

    assert (
        user.display_name
        == "New User"
    )

    assert (
        user.role
        == UserRole.USER
    )

    assert user.is_active is True
    assert user.is_verified is True

    assert len(
        repository.users
    ) == 1


def test_unverified_email_is_rejected():
    repository = (
        FakeUserRepository()
    )

    payload = create_payload(
        email_verified=False,
    )

    with pytest.raises(
        HTTPException
    ) as exc_info:
        provision_auth0_user(
            payload=payload,
            repository=repository,
        )

    assert (
        exc_info.value.status_code
        == 403
    )

    assert len(
        repository.users
    ) == 0


def test_missing_email_is_rejected():
    repository = (
        FakeUserRepository()
    )

    payload = create_payload()

    del payload[
        AUTH0_EMAIL_CLAIM
    ]

    with pytest.raises(
        HTTPException
    ) as exc_info:
        provision_auth0_user(
            payload=payload,
            repository=repository,
        )

    assert (
        exc_info.value.status_code
        == 403
    )


def test_invalid_email_is_rejected():
    repository = (
        FakeUserRepository()
    )

    payload = create_payload(
        email="not-an-email",
    )

    with pytest.raises(
        HTTPException
    ) as exc_info:
        provision_auth0_user(
            payload=payload,
            repository=repository,
        )

    assert (
        exc_info.value.status_code
        == 403
    )


def test_existing_auth0_user_is_reused():
    existing_user = User.create(
        user_id="usr_existing",
        email="existing@example.com",
        display_name="Existing User",
        auth0_subject=(
            "auth0|existing"
        ),
        is_active=True,
        is_verified=True,
    )

    repository = FakeUserRepository(
        users=[
            existing_user
        ]
    )

    payload = create_payload(
        subject="auth0|existing",
        email="existing@example.com",
    )

    user = provision_auth0_user(
        payload=payload,
        repository=repository,
    )

    assert user is existing_user

    assert len(
        repository.users
    ) == 1


def test_existing_email_is_not_automatically_linked():
    existing_user = User.create(
        user_id="usr_existing",
        email="existing@example.com",
        display_name="Existing User",
        auth0_subject=None,
        is_active=True,
        is_verified=True,
    )

    repository = FakeUserRepository(
        users=[
            existing_user
        ]
    )

    payload = create_payload(
        subject=(
            "auth0|different-identity"
        ),
        email="existing@example.com",
    )

    with pytest.raises(
        HTTPException
    ) as exc_info:
        provision_auth0_user(
            payload=payload,
            repository=repository,
        )

    assert (
        exc_info.value.status_code
        == 409
    )

    assert (
        existing_user.auth0_subject
        is None
    )


def test_missing_name_uses_email_prefix():
    repository = (
        FakeUserRepository()
    )

    payload = create_payload(
        email="henning@example.com",
        name="",
    )

    user = provision_auth0_user(
        payload=payload,
        repository=repository,
    )

    assert (
        user.display_name
        == "henning"
    )


def test_new_user_can_never_choose_admin_role():
    repository = (
        FakeUserRepository()
    )

    payload = create_payload()

    # Even if malicious/unexpected token data
    # contains something called "role", provisioning
    # completely ignores it.
    payload["role"] = "admin"

    user = provision_auth0_user(
        payload=payload,
        repository=repository,
    )

    assert (
        user.role
        == UserRole.USER
    )