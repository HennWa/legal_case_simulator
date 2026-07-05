from fastapi import APIRouter
from pydantic import BaseModel
from backend.legal_services.legal_services import LegalServices
from backend.llm_interface.llm_interface import MockLLMProvider
from backend.database.repositories.graph_repository import GraphRepository
import os
from dotenv import load_dotenv

router = APIRouter()

load_dotenv(override=True)
openai_api_key = os.getenv('OPENAI_API_KEY')

class LegalCheckRequest(BaseModel):
    case_id: str
    node_id: str

@router.post("/legal_check")
def legal_check(payload: LegalCheckRequest):

    repo = GraphRepository()
    graph = repo.load_graph(payload.case_id)

    llm = MockLLMProvider(key=openai_api_key)
    legal_services = LegalServices(graph, llm)

    legal_services.legal_check(payload.node_id)
    repo.save_graph(graph)

    return {"success": True}