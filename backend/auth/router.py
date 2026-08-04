# backend/auth/router.py

from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.auth.dependencies import get_current_user
from backend.auth.models import (
    CurrentUserResponse,
    User,
)


router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
)


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
    )