from fastapi import APIRouter
from backend.database.repositories.graph_repository import GraphRepository


router = APIRouter()

@router.get("/graph/{case_id}")
def get_graph(case_id: str):


    repo = GraphRepository()
    graph = repo.load_graph(case_id)

    return graph.to_dict()