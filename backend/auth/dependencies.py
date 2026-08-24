# backend/auth/dependencies.py

from __future__ import annotations

from fastapi import (
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from backend.auth.jwt import (
    TokenValidationError,
    validate_access_token,
)
from backend.auth.models import User
from backend.config import AuthMode, settings
from backend.database.repositories.user_repository import (
    UserRepository,
)


bearer_scheme = HTTPBearer(
    auto_error=False
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


def get_auth0_user(
    credentials: HTTPAuthorizationCredentials | None,
) -> User:
    """
    Validate the Auth0 Bearer token and map the Auth0
    identity to a local Casendra user.
    """

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unsupported authorization scheme.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    token = credentials.credentials

    try:
        payload = validate_access_token(
            token
        )
    except TokenValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={
                "WWW-Authenticate": "Bearer",
            },
        ) from exc

    auth0_subject = payload.get("sub")

    if (
        not isinstance(auth0_subject, str)
        or not auth0_subject
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Access token does not contain "
                "a valid subject claim."
            ),
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    repository = UserRepository()

    user = repository.get_by_auth0_subject(
        auth0_subject
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "No Casendra user is linked "
                "to this Auth0 identity."
            ),
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The Casendra user is inactive.",
        )

    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> User:
    """
    Resolve the user making the current request.

    Development:
        Returns the configured development user.

    Auth0:
        Validates the Bearer access token and maps
        the token's `sub` claim to a local MongoDB user.

    Tests:
        FastAPI dependency overrides should supply
        test users directly.
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
        return get_auth0_user(
            credentials
        )

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unsupported authentication mode.",
    )