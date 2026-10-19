
from fastapi import (
    APIRouter,
    Depends,
)
from pydantic import BaseModel

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


class DeleteNodeRequest(BaseModel):
    case_id: str
    node_id: str


@router.post("/delete_node")
def delete_node(
    payload: DeleteNodeRequest,
    current_user: User = Depends(
        get_current_user
    ),
):
    require_case_access(
        payload.case_id,
        current_user,
    )

    repository = GraphRepository()

    graph = repository.load_graph(
        payload.case_id
    )

    graph.delete_node(
        payload.node_id
    )

    repository.sync_to_mongo(
        graph
    )

    return {
        "success": True
    }