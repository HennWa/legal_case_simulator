# backend/auth/router.py

from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
)

from backend.auth.dependencies import (
    get_current_user,
)
from backend.auth.models import (
    CurrentUserResponse,
    User,
)
from backend.database.repositories.user_repository import (
    UserRepository,
)
from backend.services.usage_service import (
    UsageService,
)


router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
)


@router.get(
    "/me",
    response_model=(
        CurrentUserResponse
    ),
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
) -> CurrentUserResponse:
    repository = (
        UserRepository()
    )

    current_user = (
        repository.set_last_login(
            current_user.id
        )
    )

    usage = (
        UsageService
        .get_node_usage(
            current_user
        )
    )

    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=(
            current_user.display_name
        ),
        role=current_user.role,
        is_active=(
            current_user.is_active
        ),
        is_verified=(
            current_user.is_verified
        ),
        nodes_created=(
            usage.nodes_created
        ),
        node_limit=(
            usage.node_limit
        ),
        nodes_remaining=(
            usage.nodes_remaining
        ),
    )