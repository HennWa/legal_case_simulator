# backend/config.py

from __future__ import annotations

import os
from dataclasses import dataclass
from enum import StrEnum

from dotenv import load_dotenv


load_dotenv()


class AppEnvironment(StrEnum):
    DEVELOPMENT = "development"
    TEST = "test"
    PRODUCTION = "production"


class AuthMode(StrEnum):
    DEVELOPMENT = "development"
    TEST = "test"
    AUTH0 = "auth0"


def _read_required_environment_variable(name: str) -> str:
    value = os.getenv(name)

    if value is None or not value.strip():
        raise RuntimeError(
            f"Required environment variable {name!r} is missing."
        )

    return value.strip()


def _read_comma_separated_environment_variable(
    name: str,
    default: str = "",
) -> list[str]:
    raw_value = os.getenv(name, default)

    return [
        entry.strip()
        for entry in raw_value.split(",")
        if entry.strip()
    ]


@dataclass(frozen=True)
class Settings:
    app_environment: AppEnvironment
    auth_mode: AuthMode

    mongodb_uri: str
    mongodb_database: str
    mongodb_vector_database: str

    dev_user_id: str
    dev_user_email: str
    dev_user_display_name: str

    cors_allowed_origins: tuple[str, ...]

    # These are placeholders for Step 2 and Step 3.
    auth0_domain: str | None
    auth0_audience: str | None

    @classmethod
    def from_environment(cls) -> "Settings":
        app_environment = AppEnvironment(
            os.getenv(
                "APP_ENV",
                AppEnvironment.DEVELOPMENT.value,
            ).strip().lower()
        )

        auth_mode = AuthMode(
            os.getenv(
                "AUTH_MODE",
                AuthMode.DEVELOPMENT.value,
            ).strip().lower()
        )

        mongodb_uri = _read_required_environment_variable(
            "MONGODB_URI"
        )

        mongodb_database = os.getenv(
            "MONGODB_DATABASE",
            "legal_case_simulator_dev",
        ).strip()

        if not mongodb_database:
            raise RuntimeError(
                "MONGODB_DATABASE must not be empty."
            )

        mongodb_vector_database = os.getenv(
            "MONGODB_VECTOR_DATABASE",
            "legal_case_simulator",
        ).strip()

        if not mongodb_vector_database:
            raise RuntimeError(
                "MONGODB_VECTOR_DATABASE must not be empty."
            )

        dev_user_id = os.getenv(
            "DEV_USER_ID",
            "usr_dev_henning",
        ).strip()

        dev_user_email = os.getenv(
            "DEV_USER_EMAIL",
            "henning@example.test",
        ).strip()

        dev_user_display_name = os.getenv(
            "DEV_USER_DISPLAY_NAME",
            "Henning Development",
        ).strip()

        cors_allowed_origins = tuple(
            _read_comma_separated_environment_variable(
                "CORS_ALLOWED_ORIGINS",
                (
                    "http://localhost:3000,"
                    "http://localhost:5173,"
                    "http://localhost:5174,"
                    "http://127.0.0.1:5173,"
                    "http://127.0.0.1:5174"
                ),
            )
        )

        settings = cls(
            app_environment=app_environment,
            auth_mode=auth_mode,
            mongodb_uri=mongodb_uri,
            mongodb_database=mongodb_database,
            mongodb_vector_database=mongodb_vector_database,
            dev_user_id=dev_user_id,
            dev_user_email=dev_user_email,
            dev_user_display_name=dev_user_display_name,
            cors_allowed_origins=cors_allowed_origins,
            auth0_domain=os.getenv("AUTH0_DOMAIN"),
            auth0_audience=os.getenv("AUTH0_AUDIENCE"),
        )

        settings.validate()

        return settings

    def validate(self) -> None:
        if (
            self.app_environment == AppEnvironment.PRODUCTION
            and self.auth_mode != AuthMode.AUTH0
        ):
            raise RuntimeError(
                "Production must use AUTH_MODE=auth0. "
                f"Current value: {self.auth_mode.value!r}."
            )

        if (
            self.app_environment != AppEnvironment.TEST
            and self.auth_mode == AuthMode.TEST
        ):
            raise RuntimeError(
                "AUTH_MODE=test may only be used with APP_ENV=test."
            )

        if self.auth_mode == AuthMode.DEVELOPMENT:
            if not self.dev_user_id:
                raise RuntimeError(
                    "DEV_USER_ID must be configured in development mode."
                )

            if not self.dev_user_email:
                raise RuntimeError(
                    "DEV_USER_EMAIL must be configured in development mode."
                )

        if self.auth_mode == AuthMode.AUTH0:
            if not self.auth0_domain:
                raise RuntimeError(
                    "AUTH0_DOMAIN is required when AUTH_MODE=auth0."
                )

            if not self.auth0_audience:
                raise RuntimeError(
                    "AUTH0_AUDIENCE is required when AUTH_MODE=auth0."
                )


settings = Settings.from_environment()