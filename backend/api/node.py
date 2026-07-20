from fastapi import APIRouter
from pydantic import BaseModel
import os
from backend.object_graph_runtime.graph_classes import CaseGraph
from backend.database.repositories.graph_repository import GraphRepository
from backend.database.repositories.node_repository import NodeRepository
from backend.utils.utils import get_frontend_dir

router = APIRouter()

class NodeRequest(BaseModel):
    case_id: str
    node_id: str

@router.post("/node")
def get_node(payload: NodeRequest):

    repo = GraphRepository()
    graph = repo.load_graph(payload.case_id)

    return graph.node_to_dict(payload.node_id)




