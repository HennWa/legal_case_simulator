# backend/scripts/seed_development_users.py

from __future__ import annotations

from backend.auth.models import User, UserRole
from backend.config import (
    AppEnvironment,
    AuthMode,
    settings,
)
from backend.database.init_db import create_indexes
from backend.database.mongo import (
    verify_database_connection,
)
from backend.database.repositories.user_repository import (
    UserRepository,
)


def seed_development_users() -> None:
    if settings.app_environment == AppEnvironment.PRODUCTION:
        raise RuntimeError(
            "Development users must never be seeded "
            "into the production environment."
        )

    if settings.auth_mode != AuthMode.DEVELOPMENT:
        raise RuntimeError(
            "This seed script requires "
            "AUTH_MODE=development."
        )

    verify_database_connection()
    create_indexes()

    repository = UserRepository()

    development_user = User.create(
        user_id=settings.dev_user_id,
        email=settings.dev_user_email,
        display_name=settings.dev_user_display_name,
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )

    stored_user = repository.upsert(
        development_user
    )

    print("Development user seeded successfully:")
    print(f"  ID:           {stored_user.id}")
    print(f"  Email:        {stored_user.email}")
    print(f"  Display name: {stored_user.display_name}")
    print(f"  Role:         {stored_user.role.value}")
    print(
        f"  Database:     {settings.mongodb_database}"
    )


if __name__ == "__main__":
    seed_development_users()