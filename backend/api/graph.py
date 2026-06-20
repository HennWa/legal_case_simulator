from fastapi import APIRouter
import os
from object_graph_runtime.graph_classes import CaseGraph
from utils.utils import get_frontend_dir

router = APIRouter()

@router.get("/graph")
def get_graph():

    path_graph = os.path.join(get_frontend_dir(), 'src/data/graph.json')

    loaded_graph = CaseGraph.from_json(path_graph)

    return loaded_graph.to_dict()