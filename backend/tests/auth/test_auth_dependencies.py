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
from backend.auth.models import (
    User,
)


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------


def create_test_user(
    *,
    user_id: str = "usr_test_user",
    auth0_subject: str = "auth0|test-user",
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


def patch_user_repository(
    monkeypatch,
    *,
    user: User | None,
):
    class FakeUserRepository:
        def get_by_auth0_subject(
            self,
            auth0_subject: str,
        ):
            return user

    monkeypatch.setattr(
        auth_dependencies,
        "UserRepository",
        FakeUserRepository,
    )


# ------------------------------------------------------------------
# Authentication tests
# ------------------------------------------------------------------


def test_missing_bearer_token_returns_401():
    with pytest.raises(
        HTTPException
    ) as exc_info:
        auth_dependencies.get_auth0_user(
            credentials=None
        )

    assert exc_info.value.status_code == 401
    assert (
        exc_info.value.detail
        == "Authorization header is missing."
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

    credentials = create_credentials()

    with pytest.raises(
        HTTPException
    ) as exc_info:
        auth_dependencies.get_auth0_user(
            credentials
        )

    assert exc_info.value.status_code == 401
    assert (
        exc_info.value.detail
        == "Access token is invalid."
    )


def test_token_without_subject_returns_401(
    monkeypatch,
):
    def fake_validate_access_token(
        token: str,
    ):
        return {
            "aud": "https://api.casendra.legal",
        }

    monkeypatch.setattr(
        auth_dependencies,
        "validate_access_token",
        fake_validate_access_token,
    )

    credentials = create_credentials()

    with pytest.raises(
        HTTPException
    ) as exc_info:
        auth_dependencies.get_auth0_user(
            credentials
        )

    assert exc_info.value.status_code == 401

    assert exc_info.value.detail == (
        "Access token does not contain "
        "a valid subject claim."
    )


def test_empty_subject_returns_401(
    monkeypatch,
):
    def fake_validate_access_token(
        token: str,
    ):
        return {
            "sub": "",
        }

    monkeypatch.setattr(
        auth_dependencies,
        "validate_access_token",
        fake_validate_access_token,
    )

    credentials = create_credentials()

    with pytest.raises(
        HTTPException
    ) as exc_info:
        auth_dependencies.get_auth0_user(
            credentials
        )

    assert exc_info.value.status_code == 401


def test_unknown_casendra_user_returns_403(
    monkeypatch,
):
    def fake_validate_access_token(
        token: str,
    ):
        return {
            "sub": "auth0|unknown-user",
        }

    monkeypatch.setattr(
        auth_dependencies,
        "validate_access_token",
        fake_validate_access_token,
    )

    patch_user_repository(
        monkeypatch,
        user=None,
    )

    credentials = create_credentials()

    with pytest.raises(
        HTTPException
    ) as exc_info:
        auth_dependencies.get_auth0_user(
            credentials
        )

    assert exc_info.value.status_code == 403

    assert exc_info.value.detail == (
        "No Casendra user is linked "
        "to this Auth0 identity."
    )


def test_inactive_casendra_user_returns_403(
    monkeypatch,
):
    user = create_test_user(
        is_active=False,
    )

    def fake_validate_access_token(
        token: str,
    ):
        return {
            "sub": user.auth0_subject,
        }

    monkeypatch.setattr(
        auth_dependencies,
        "validate_access_token",
        fake_validate_access_token,
    )

    patch_user_repository(
        monkeypatch,
        user=user,
    )

    credentials = create_credentials()

    with pytest.raises(
        HTTPException
    ) as exc_info:
        auth_dependencies.get_auth0_user(
            credentials
        )

    assert exc_info.value.status_code == 403

    assert (
        exc_info.value.detail
        == "The Casendra user is inactive."
    )


def test_active_casendra_user_is_returned(
    monkeypatch,
):
    user = create_test_user()

    def fake_validate_access_token(
        token: str,
    ):
        return {
            "sub": user.auth0_subject,
        }

    monkeypatch.setattr(
        auth_dependencies,
        "validate_access_token",
        fake_validate_access_token,
    )

    patch_user_repository(
        monkeypatch,
        user=user,
    )

    credentials = create_credentials()

    result = (
        auth_dependencies.get_auth0_user(
            credentials
        )
    )

    assert result is user
    assert result.id == "usr_test_user"
    assert result.is_active is True