# backend/tests/auth/test_config_security.py

import pytest

from backend.config import (
    AppEnvironment,
    AuthMode,
    Settings,
)


def create_settings(
    *,
    app_environment: AppEnvironment,
    auth_mode: AuthMode,
    auth0_domain: str | None = None,
    auth0_audience: str | None = None,
) -> Settings:
    return Settings(
        app_environment=app_environment,
        auth_mode=auth_mode,
        mongodb_uri="mongodb://test",
        mongodb_database=(
            "legal_case_simulator_test"
        ),
        mongodb_vector_database=(
            "legal_case_simulator_test"
        ),
        dev_user_id="usr_test",
        dev_user_email="test@example.com",
        dev_user_display_name="Test User",
        cors_allowed_origins=(
            "http://localhost:5173",
        ),
        auth0_domain=auth0_domain,
        auth0_audience=auth0_audience,
    )


def test_production_rejects_development_auth():
    settings = create_settings(
        app_environment=(
            AppEnvironment.PRODUCTION
        ),
        auth_mode=AuthMode.DEVELOPMENT,
    )

    with pytest.raises(
        RuntimeError,
        match=(
            "AUTH_MODE=development may "
            "only be used"
        ),
    ):
        settings.validate()


def test_test_environment_rejects_development_auth():
    settings = create_settings(
        app_environment=AppEnvironment.TEST,
        auth_mode=AuthMode.DEVELOPMENT,
    )

    with pytest.raises(
        RuntimeError,
        match=(
            "AUTH_MODE=development may "
            "only be used"
        ),
    ):
        settings.validate()


def test_production_accepts_auth0():
    settings = create_settings(
        app_environment=(
            AppEnvironment.PRODUCTION
        ),
        auth_mode=AuthMode.AUTH0,
        auth0_domain=(
            "casendra.us.auth0.com"
        ),
        auth0_audience=(
            "https://api.casendra.legal"
        ),
    )

    settings.validate()


def test_test_environment_accepts_test_auth():
    settings = create_settings(
        app_environment=AppEnvironment.TEST,
        auth_mode=AuthMode.TEST,
    )

    settings.validate()


def test_auth0_requires_domain():
    settings = create_settings(
        app_environment=(
            AppEnvironment.PRODUCTION
        ),
        auth_mode=AuthMode.AUTH0,
        auth0_domain=None,
        auth0_audience=(
            "https://api.casendra.legal"
        ),
    )

    with pytest.raises(
        RuntimeError,
        match="AUTH0_DOMAIN is required",
    ):
        settings.validate()


def test_auth0_requires_audience():
    settings = create_settings(
        app_environment=(
            AppEnvironment.PRODUCTION
        ),
        auth_mode=AuthMode.AUTH0,
        auth0_domain=(
            "casendra.us.auth0.com"
        ),
        auth0_audience=None,
    )

    with pytest.raises(
        RuntimeError,
        match="AUTH0_AUDIENCE is required",
    ):
        settings.validate()