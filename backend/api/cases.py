from fastapi import (
    APIRouter,
    Depends,
)

from backend.auth.dependencies import (
    get_current_user,
)
from backend.auth.models import User
from backend.database.repositories.case_repository import (
    CaseRepository,
)


router = APIRouter()


@router.get("/cases")
def get_cases(
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return all cases owned by the authenticated
    Casendra user.

    The owner ID is intentionally derived from the
    authenticated user and must not be supplied by
    the client.
    """

    repository = CaseRepository()

    cases = repository.get_by_owner_id(
        current_user.id
    )

    return [
        case.model_dump(
            mode="json"
        )
        for case in cases
    ]