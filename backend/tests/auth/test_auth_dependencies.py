# backend/tests/auth/test_auth_dependencies.py

import pytest

from fastapi import HTTPException
from fastapi.security import (
    HTTPAuthorizationCredentials,
)

import backend.auth.dependencies as auth_dependencies

from backend.auth.jwt import (
    TokenValidationError,
)
from backend.auth.models import User
from backend.auth.provisioning import (
    AUTH0_EMAIL_CLAIM,
    AUTH0_EMAIL_VERIFIED_CLAIM,
    AUTH0_NAME_CLAIM,
)


def create_test_user(
    *,
    user_id: str = (
        "usr_test_user"
    ),
    auth0_subject: str = (
        "auth0|test-user"
    ),
    is_active: bool = True,
) -> User:
    return User.create(
        user_id=user_id,
        email="test@example.com",
        display_name="Test User",
        auth0_subject=auth0_subject,
        is_active=is_active,
        is_verified=True,
    )


def create_credentials(
    token: str = "test-token",
) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=token,
    )


class FakeUserRepository:
    def __init__(
        self,
        *,
        user: User | None = None,
    ):
        self.users = []

        if user is not None:
            self.users.append(
                user
            )

    def get(
        self,
        user_id: str,
    ):
        for user in self.users:
            if user.id == user_id:
                return user

        return None

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
        normalized = (
            email.strip().lower()
        )

        for user in self.users:
            if (
                user.email_normalized
                == normalized
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


def patch_user_repository(
    monkeypatch,
    *,
    user: User | None = None,
):
    repository = FakeUserRepository(
        user=user
    )

    monkeypatch.setattr(
        auth_dependencies,
        "UserRepository",
        lambda: repository,
    )

    return repository


def test_missing_bearer_token_returns_401():
    with pytest.raises(
        HTTPException
    ) as exc_info:
        auth_dependencies.get_auth0_user(
            credentials=None
        )

    assert (
        exc_info.value.status_code
        == 401
    )


def test_invalid_access_token_returns_401(
    monkeypatch,
):
    def fake_validate_access_token(
        token: str,
    ):
        raise TokenValidationError(
            "Access token is invalid."
        )

    monkeypatch.setattr(
        auth_dependencies,
        "validate_access_token",
        fake_validate_access_token,
    )

    with pytest.raises(
        HTTPException
    ) as exc_info:
        auth_dependencies.get_auth0_user(
            create_credentials()
        )

    assert (
        exc_info.value.status_code
        == 401
    )


def test_token_without_subject_returns_401(
    monkeypatch,
):
    monkeypatch.setattr(
        auth_dependencies,
        "validate_access_token",
        lambda token: {
            "aud":
                "https://api.casendra.legal",
        },
    )

    with pytest.raises(
        HTTPException
    ) as exc_info:
        auth_dependencies.get_auth0_user(
            create_credentials()
        )

    assert (
        exc_info.value.status_code
        == 401
    )


def test_new_verified_auth0_user_is_provisioned(
    monkeypatch,
):
    monkeypatch.setattr(
        auth_dependencies,
        "validate_access_token",
        lambda token: {
            "sub":
                "auth0|new-user",

            AUTH0_EMAIL_CLAIM:
                "new@example.com",

            AUTH0_EMAIL_VERIFIED_CLAIM:
                True,

            AUTH0_NAME_CLAIM:
                "New User",
        },
    )

    repository = (
        patch_user_repository(
            monkeypatch
        )
    )

    result = (
        auth_dependencies
        .get_auth0_user(
            create_credentials()
        )
    )

    assert (
        result.auth0_subject
        == "auth0|new-user"
    )

    assert (
        result.email
        == "new@example.com"
    )

    assert (
        result.display_name
        == "New User"
    )

    assert len(
        repository.users
    ) == 1


def test_new_unverified_auth0_user_returns_403(
    monkeypatch,
):
    monkeypatch.setattr(
        auth_dependencies,
        "validate_access_token",
        lambda token: {
            "sub":
                "auth0|new-user",

            AUTH0_EMAIL_CLAIM:
                "new@example.com",

            AUTH0_EMAIL_VERIFIED_CLAIM:
                False,

            AUTH0_NAME_CLAIM:
                "New User",
        },
    )

    patch_user_repository(
        monkeypatch
    )

    with pytest.raises(
        HTTPException
    ) as exc_info:
        auth_dependencies.get_auth0_user(
            create_credentials()
        )

    assert (
        exc_info.value.status_code
        == 403
    )


def test_inactive_existing_user_returns_403(
    monkeypatch,
):
    user = create_test_user(
        is_active=False
    )

    monkeypatch.setattr(
        auth_dependencies,
        "validate_access_token",
        lambda token: {
            "sub":
                user.auth0_subject,
        },
    )

    patch_user_repository(
        monkeypatch,
        user=user,
    )

    with pytest.raises(
        HTTPException
    ) as exc_info:
        auth_dependencies.get_auth0_user(
            create_credentials()
        )

    assert (
        exc_info.value.status_code
        == 403
    )


def test_active_existing_user_is_returned(
    monkeypatch,
):
    user = create_test_user()

    monkeypatch.setattr(
        auth_dependencies,
        "validate_access_token",
        lambda token: {
            "sub":
                user.auth0_subject,
        },
    )

    patch_user_repository(
        monkeypatch,
        user=user,
    )

    result = (
        auth_dependencies
        .get_auth0_user(
            create_credentials()
        )
    )

    assert result is user
    assert result.is_active is True