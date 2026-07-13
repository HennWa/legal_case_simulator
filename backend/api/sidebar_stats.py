from fastapi import APIRouter
from pydantic import BaseModel
from backend.database.repositories.graph_repository import GraphRepository

router = APIRouter()

class NodeRequest(BaseModel):
    case_id: str
    node_id: str

@router.post("/sidebar_stats")
def sidebar_stats(payload: NodeRequest):

    repo = GraphRepository()
    graph = repo.load_graph(payload.case_id)

    return graph.get_path_info(payload.node_id)


