from fastapi import APIRouter
from object_graph_runtime.graph_classes import CaseGraph
from utils.utils import get_frontend_dir
import os
from dotenv import load_dotenv


router = APIRouter()

load_dotenv(override=True)
openai_api_key = os.getenv('OPENAI_API_KEY')

@router.post("/delete_node/{node_id}")
def delete_node(node_id: str):

    path_graph = os.path.join(get_frontend_dir(), 'src/data/graph.json')

    graph = CaseGraph.from_json(path_graph)

    print(f'Delete node with id: {node_id}')
    graph.delete_node(node_id)

    graph.to_json(os.path.join(get_frontend_dir(), 'src/data/graph.json'))

    return {"success": True}