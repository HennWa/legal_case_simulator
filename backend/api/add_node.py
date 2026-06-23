from fastapi import APIRouter
from pathlib import Path
from object_graph_runtime.graph_classes import CaseGraph
from expansion_engine.exapnsion_engine import ExpansionEngine
from llm_interface.llm_interface import MockLLMProvider
from database.repositories.graph_repository import GraphRepository
import os
from dotenv import load_dotenv

router = APIRouter()

load_dotenv(override=True)
openai_api_key = os.getenv('OPENAI_API_KEY')

@router.post("/add_node/{node_id}")
def add_node(node_id: str):

    #path_graph = os.path.join(Path(__file__).resolve().parent.parent.parent, 'frontend/src/data/graph.json')
    # graph = CaseGraph.from_json(path_graph)

    case_id = '7777'  # temporary
    repo = GraphRepository()
    graph = repo.load_graph(case_id)

    llm = MockLLMProvider(key=openai_api_key)

    engine = ExpansionEngine(graph, llm)

    print(f'Expanding node with id: {node_id}')

    branch_node = engine.expand_node(node_id)

    repo.save_graph(graph)

    return branch_node.model_dump()