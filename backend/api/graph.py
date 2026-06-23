from fastapi import APIRouter
from database.repositories.graph_repository import GraphRepository


router = APIRouter()

@router.get("/graph")
def get_graph():

    case_id = '7777'  # temporary
    repo = GraphRepository()
    graph = repo.load_graph(case_id)

    return graph.to_dict()