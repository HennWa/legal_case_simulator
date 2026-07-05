from fastapi import APIRouter
from pydantic import BaseModel
from backend.database.repositories.graph_repository import GraphRepository
from backend.utils.utils import get_frontend_dir
import os
from dotenv import load_dotenv


router = APIRouter()

load_dotenv(override=True)
openai_api_key = os.getenv('OPENAI_API_KEY')

class DeleteNodeRequest(BaseModel):
    case_id: str
    node_id: str

@router.post("/delete_node")
def delete_node(payload: DeleteNodeRequest):

    repo = GraphRepository()
    graph = repo.load_graph(payload.case_id)

    graph.delete_node(payload.node_id)
    graph.to_json(os.path.join(get_frontend_dir(), 'src/data/graph.json'))

    repo.sync_to_mongo(graph)

    return {"success": True}