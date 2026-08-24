# backend/auth/jwt.py

from __future__ import annotations

from typing import Any

import jwt
from jwt import PyJWKClient

from backend.config import settings


ALGORITHMS = ["RS256"]


class TokenValidationError(Exception):
    """
    Raised when an Auth0 access token cannot be validated.
    """


def _get_auth0_domain() -> str:
    domain = settings.auth0_domain

    if domain is None:
        raise RuntimeError(
            "AUTH0_DOMAIN is not configured."
        )

    domain = domain.strip()

    if domain.startswith("https://"):
        domain = domain.removeprefix("https://")

    if domain.startswith("http://"):
        domain = domain.removeprefix("http://")

    return domain.rstrip("/")


def get_auth0_issuer() -> str:
    """
    Auth0 issuer must include:
        - https://
        - trailing slash
    """

    domain = _get_auth0_domain()

    return f"https://{domain}/"


def get_auth0_jwks_url() -> str:
    """
    URL where Auth0 publishes the public keys used to verify JWTs.
    """

    domain = _get_auth0_domain()

    return (
        f"https://{domain}/"
        ".well-known/jwks.json"
    )


_jwks_client = PyJWKClient(
    get_auth0_jwks_url()
)


def validate_access_token(
    token: str,
) -> dict[str, Any]:
    """
    Validate an Auth0 access token.

    Validation includes:
        - JWT signature
        - signing algorithm
        - issuer
        - audience
        - expiration

    Returns the decoded JWT claims if valid.
    """

    audience = settings.auth0_audience

    if audience is None:
        raise RuntimeError(
            "AUTH0_AUDIENCE is not configured."
        )

    try:
        signing_key = (
            _jwks_client.get_signing_key_from_jwt(
                token
            )
        )

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=ALGORITHMS,
            audience=audience,
            issuer=get_auth0_issuer(),
        )

        return payload

    except jwt.ExpiredSignatureError as exc:
        raise TokenValidationError(
            "Access token has expired."
        ) from exc

    except jwt.InvalidAudienceError as exc:
        raise TokenValidationError(
            "Access token has an invalid audience."
        ) from exc

    except jwt.InvalidIssuerError as exc:
        raise TokenValidationError(
            "Access token has an invalid issuer."
        ) from exc

    except jwt.InvalidSignatureError as exc:
        raise TokenValidationError(
            "Access token signature is invalid."
        ) from exc

    except jwt.PyJWTError as exc:
        raise TokenValidationError(
            "Access token is invalid."
        ) from exc

    except Exception as exc:
        raise TokenValidationError(
            "Access token could not be validated."
        ) from exc