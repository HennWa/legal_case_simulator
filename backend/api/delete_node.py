from fastapi import APIRouter
from database.repositories.graph_repository import GraphRepository
from utils.utils import get_frontend_dir
import os
from dotenv import load_dotenv


router = APIRouter()

load_dotenv(override=True)
openai_api_key = os.getenv('OPENAI_API_KEY')

@router.post("/delete_node/{node_id}")
def delete_node(node_id: str):

    case_id = '7777'  # temporary
    repo = GraphRepository()
    graph = repo.load_graph(case_id)

    print(f'Delete node with id: {node_id}')
    graph.delete_node(node_id)
    graph.to_json(os.path.join(get_frontend_dir(), 'src/data/graph.json'))

    repo.sync_to_mongo(graph)

    return {"success": True}