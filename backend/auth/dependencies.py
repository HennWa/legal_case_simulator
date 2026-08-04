# backend/auth/dependencies.py

from __future__ import annotations

from fastapi import HTTPException, status

from backend.auth.models import User
from backend.config import AuthMode, settings
from backend.database.repositories.user_repository import (
    UserRepository,
)


def get_development_user() -> User:
    repository = UserRepository()

    user = repository.get(
        settings.dev_user_id
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "The configured development user does not exist. "
                "Run the development-user seed script."
            ),
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The development user is inactive.",
        )

    return user


def get_current_user() -> User:
    """
    Resolve the user making the current request.

    Step 1:
        development mode returns a fixed MongoDB user.

    Step 3:
        auth0 mode will validate an Auth0 access token and map its `sub`
        claim to a local MongoDB user.

    Tests:
        FastAPI dependency overrides should supply test users directly.
    """

    if settings.auth_mode == AuthMode.DEVELOPMENT:
        return get_development_user()

    if settings.auth_mode == AuthMode.TEST:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Test authentication must use a FastAPI "
                "dependency override."
            ),
        )

    if settings.auth_mode == AuthMode.AUTH0:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=(
                "Auth0 token validation has not been implemented yet."
            ),
        )

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unsupported authentication mode.",
    )