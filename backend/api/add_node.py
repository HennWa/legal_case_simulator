from fastapi import APIRouter
from pydantic import BaseModel
from backend.expansion_engine.exapnsion_engine import ExpansionEngine
from backend.llm_interface.llm_interface import MockLLMProvider
from backend.database.repositories.graph_repository import GraphRepository
import os
from dotenv import load_dotenv

router = APIRouter()

load_dotenv(override=True)
openai_api_key = os.getenv('OPENAI_API_KEY')

class AddNodeRequest(BaseModel):
    case_id: str
    node_id: str


@router.post("/add_node")
def add_node(payload: AddNodeRequest):
    repo = GraphRepository()
    graph = repo.load_graph(payload.case_id)

    llm = MockLLMProvider(key=openai_api_key)
    engine = ExpansionEngine(graph, llm)

    branch_node = engine.expand_node(payload.node_id)
    repo.save_graph(graph)

    return branch_node.model_dump()