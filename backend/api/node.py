from fastapi import APIRouter
import os
from backend.object_graph_runtime.graph_classes import CaseGraph
from backend.database.repositories.graph_repository import GraphRepository
from backend.utils.utils import get_frontend_dir

router = APIRouter()

@router.get("/node/{node_id}")
def get_node(node_id: str):

    #path_graph = os.path.join(get_frontend_dir(), 'src/data/graph.json')
    #loaded_graph = CaseGraph.from_json(path_graph)

    case_id = '7777'  # temporary
    repo = GraphRepository()
    graph = repo.load_graph(case_id)

    return graph.node_to_dict(node_id)
