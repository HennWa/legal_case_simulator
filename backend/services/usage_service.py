# backend/services/usage_service.py

from __future__ import annotations

from dataclasses import dataclass

from fastapi import (
    HTTPException,
    status,
)

from backend.auth.models import (
    User,
    UserRole,
)
from backend.config import settings
from backend.database.repositories.user_repository import (
    UserRepository,
)


@dataclass(frozen=True)
class NodeUsage:
    nodes_created: int
    node_limit: int | None
    nodes_remaining: int | None


class UsageService:
    """
    Application-level usage and quota handling.

    The graph/expansion engine deliberately knows nothing
    about users, subscriptions, quotas, or billing.
    """

    def __init__(
        self,
        repository: UserRepository | None = None,
    ) -> None:
        self.repository = (
            repository
            or UserRepository()
        )

    @staticmethod
    def _is_unlimited(
        user: User,
    ) -> bool:
        return (
            user.role
            == UserRole.ADMIN
        )

    @staticmethod
    def get_effective_node_limit(
        user: User,
    ) -> int | None:
        """
        Return the effective node limit.

        Admin:
            None -> unlimited

        Normal user with override:
            user.node_limit

        Normal user without override:
            settings.node_limit_default
        """

        if UsageService._is_unlimited(
            user
        ):
            return None

        if user.node_limit is not None:
            return user.node_limit

        return settings.node_limit_default

    @classmethod
    def get_node_usage(
        cls,
        user: User,
    ) -> NodeUsage:
        limit = (
            cls.get_effective_node_limit(
                user
            )
        )

        if limit is None:
            remaining = None
        else:
            remaining = max(
                limit
                - user.nodes_created,
                0,
            )

        return NodeUsage(
            nodes_created=(
                user.nodes_created
            ),
            node_limit=limit,
            nodes_remaining=remaining,
        )

    def reserve_node_creation(
        self,
        user: User,
    ) -> User:
        """
        Reserve one node from the user's quota.

        Reservation happens before graph/LLM work starts
        so two concurrent requests cannot both pass the
        same quota check.

        Failed node generation should call
        release_node_creation().
        """

        unlimited = (
            self._is_unlimited(user)
        )

        updated_user = (
            self.repository
            .reserve_node_creation(
                user.id,
                default_limit=(
                    settings
                    .node_limit_default
                ),
                unlimited=unlimited,
            )
        )

        if updated_user is not None:
            return updated_user

        # Normally a failed atomic update means that the
        # quota condition did not match.
        #
        # Check existence separately so an unexpectedly
        # missing authenticated user is not reported as
        # a quota problem.
        stored_user = (
            self.repository.get(
                user.id
            )
        )

        if stored_user is None:
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_500_INTERNAL_SERVER_ERROR
                ),
                detail={
                    "code":
                        "user_not_found",
                    "message":
                        "The authenticated "
                        "Casendra user could "
                        "not be found.",
                },
            )

        effective_limit = (
            self.get_effective_node_limit(
                stored_user
            )
        )

        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail={
                "code":
                    "node_limit_reached",
                "message":
                    "Your node creation "
                    "limit has been reached.",
                "nodes_created":
                    stored_user.nodes_created,
                "node_limit":
                    effective_limit,
                "nodes_remaining":
                    0,
            },
        )

    def release_node_creation(
        self,
        user_id: str,
    ) -> None:
        """
        Undo a quota reservation after a technical
        creation failure.

        Successful node creation followed by later node
        deletion must NOT call this method.
        """

        released_user = (
            self.repository
            .release_node_creation(
                user_id
            )
        )

        if released_user is None:
            # At this point the original operation has
            # already failed. Avoid hiding that original
            # exception behind a rollback exception.
            return