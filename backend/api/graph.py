from fastapi import (
    APIRouter,
    Depends,
)

from backend.auth.authorization import (
    require_case_access,
)
from backend.auth.dependencies import (
    get_current_user,
)
from backend.auth.models import User
from backend.database.repositories.graph_repository import (
    GraphRepository,
)


router = APIRouter()


@router.get("/graph/{case_id}")
def get_graph(
    case_id: str,
    current_user: User = Depends(
        get_current_user
    ),
):
    require_case_access(
        case_id,
        current_user,
    )

    repository = GraphRepository()

    graph = repository.load_graph(
        case_id
    )

    return graph.to_dict()