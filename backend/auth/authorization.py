from fastapi import (
    HTTPException,
    status,
)

from backend.auth.models import User
from backend.database.repositories.case_repository import (
    CaseRepository,
)
from backend.object_graph_runtime.graph_classes import (
    Case,
)


def require_case_access(
    case_id: str,
    current_user: User,
) -> Case:
    """
    Ensure that the authenticated Casendra user is allowed
    to access the requested case.

    Current MVP authorization model:
        - the case owner has access
        - every other user is denied

    This function is intentionally centralized so that the
    authorization model can later be extended with roles such
    as collaborators, lawyers or organization members.
    """

    repository = CaseRepository()

    case = repository.get(
        case_id
    )

    if case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Case '{case_id}' was not found."
            ),
        )

    if case.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have access to this case."
            ),
        )

    return case