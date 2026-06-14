from fastapi import APIRouter
from pathlib import Path
from object_graph_runtime.graph_classes import CaseGraph
from legal_services.legal_services import LegalServices
from llm_interface.llm_interface import MockLLMProvider
import os
from dotenv import load_dotenv

router = APIRouter()

load_dotenv(override=True)
openai_api_key = os.getenv('OPENAI_API_KEY')


@router.post("/legal_check/{node_id}")
def legal_check(node_id: str):

    path_graph = os.path.join(Path(__file__).resolve().parent.parent.parent, 'frontend/src/data/graph.json')

    llm = MockLLMProvider(key=openai_api_key)
    graph = CaseGraph.from_json(path_graph)
    legal_services = LegalServices(graph, llm)

    print(f'Expanding node with id: {node_id}')

    legal_services.legal_check(node_id)

    return {"success": True}