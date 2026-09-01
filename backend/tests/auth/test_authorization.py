# backend/tests/auth/test_authorization.py

import pytest

from fastapi import HTTPException

import backend.auth.authorization as authorization

from backend.auth.models import (
    User,
    UserRole,
)
from backend.object_graph_runtime.graph_classes import (
    Case,
)


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------


def create_test_user(
    *,
    user_id: str,
    role: UserRole = UserRole.USER,
) -> User:
    return User.create(
        user_id=user_id,
        email=f"{user_id}@example.com",
        display_name=user_id,
        role=role,
        is_active=True,
        is_verified=True,
    )


def create_test_case(
    *,
    case_id: str = "case_test",
    owner_id: str = "usr_owner",
) -> Case:
    return Case(
        id=case_id,
        owner_id=owner_id,
        title="Test Case",
        created_at="2026-01-01T00:00:00+00:00",
    )


def patch_case_repository(
    monkeypatch,
    *,
    case: Case | None,
):
    class FakeCaseRepository:
        def get(
            self,
            case_id: str,
        ):
            return case

    monkeypatch.setattr(
        authorization,
        "CaseRepository",
        FakeCaseRepository,
    )


# ------------------------------------------------------------------
# Authorization tests
# ------------------------------------------------------------------


def test_missing_case_returns_404(
    monkeypatch,
):
    user = create_test_user(
        user_id="usr_owner"
    )

    patch_case_repository(
        monkeypatch,
        case=None,
    )

    with pytest.raises(
        HTTPException
    ) as exc_info:
        authorization.require_case_access(
            case_id="case_missing",
            current_user=user,
        )

    assert exc_info.value.status_code == 404


def test_other_users_case_returns_403(
    monkeypatch,
):
    user = create_test_user(
        user_id="usr_other"
    )

    case = create_test_case(
        owner_id="usr_owner"
    )

    patch_case_repository(
        monkeypatch,
        case=case,
    )

    with pytest.raises(
        HTTPException
    ) as exc_info:
        authorization.require_case_access(
            case_id=case.id,
            current_user=user,
        )

    assert exc_info.value.status_code == 403

    assert exc_info.value.detail == (
        "You do not have access to this case."
    )


def test_owner_can_access_case(
    monkeypatch,
):
    user = create_test_user(
        user_id="usr_owner"
    )

    case = create_test_case(
        owner_id=user.id
    )

    patch_case_repository(
        monkeypatch,
        case=case,
    )

    result = authorization.require_case_access(
        case_id=case.id,
        current_user=user,
    )

    assert result is case
    assert result.owner_id == user.id


def test_admin_cannot_access_another_users_case(
    monkeypatch,
):
    admin = create_test_user(
        user_id="usr_admin",
        role=UserRole.ADMIN,
    )

    case = create_test_case(
        owner_id="usr_customer"
    )

    patch_case_repository(
        monkeypatch,
        case=case,
    )

    with pytest.raises(
        HTTPException
    ) as exc_info:
        authorization.require_case_access(
            case_id=case.id,
            current_user=admin,
        )

    assert exc_info.value.status_code == 403