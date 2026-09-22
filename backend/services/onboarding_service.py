# backend/services/onboarding_service.py

from __future__ import annotations

from backend.auth.models import User
from backend.database.repositories.case_repository import (
    CaseRepository,
)
from backend.database.repositories.user_repository import (
    UserRepository,
)
from backend.services.demo_graph_service import (
    DemoGraphService,
)


class OnboardingService:
    """
    Ensures that users receive every active Casendra
    template exactly once per template family.

    Template identity is determined by template_key,
    not template_version.

    Example:

        employment_demo v1
        employment_demo v2

    If a user has already received employment_demo v1,
    that user will not automatically receive v2.

    A new user receives whichever version is currently
    active.
    """

    def __init__(self):
        self.case_repository = (
            CaseRepository()
        )

        self.user_repository = (
            UserRepository()
        )

        self.demo_graph_service = (
            DemoGraphService()
        )

    def ensure_templates_for_user(
        self,
        user: User,
    ) -> User:
        """
        Provision all active template families that the
        user has never received.

        Returns the updated User object.
        """

        active_templates = (
            self.case_repository
            .get_active_templates()
        )

        provisioned_keys = set(
            user.provisioned_template_keys
        )

        # -----------------------------------------------------
        # Validate template configuration
        # -----------------------------------------------------

        seen_template_keys: set[str] = set()

        for template in active_templates:

            template_key = (
                template.template_key
            )

            if not template_key:
                raise RuntimeError(
                    f"Active template "
                    f"'{template.id}' "
                    "has no template_key."
                )

            if (
                template.template_version
                is None
            ):
                raise RuntimeError(
                    f"Active template "
                    f"'{template.id}' "
                    "has no template_version."
                )

            if (
                template_key
                in seen_template_keys
            ):
                raise RuntimeError(
                    "More than one active template "
                    "exists for template_key "
                    f"'{template_key}'."
                )

            seen_template_keys.add(
                template_key
            )

        # -----------------------------------------------------
        # Provision missing templates
        # -----------------------------------------------------

        current_user = user

        for template in active_templates:

            template_key = (
                template.template_key
            )

            # Checked above.
            assert template_key is not None

            if (
                template_key
                in provisioned_keys
            ):
                continue

            # -------------------------------------------------
            # Migration / recovery case
            #
            # The user may already own a template-derived case
            # even though the provisioning marker does not
            # exist yet.
            # -------------------------------------------------

            existing_copy = (
                self.case_repository
                .get_user_template_copy_by_key(
                    owner_id=user.id,
                    template_key=(
                        template_key
                    ),
                )
            )

            if existing_copy is None:
                (
                    self.demo_graph_service
                    .clone_template_for_user(
                        template_case=template,
                        user=user,
                    )
                )

            # -------------------------------------------------
            # Only mark provisioned after we either found or
            # successfully created the user's copy.
            # -------------------------------------------------

            current_user = (
                self.user_repository
                .mark_template_provisioned(
                    user_id=user.id,
                    template_key=(
                        template_key
                    ),
                )
            )

            provisioned_keys.add(
                template_key
            )

        return current_user

