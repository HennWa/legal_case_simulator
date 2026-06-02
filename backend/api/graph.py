from fastapi import APIRouter
from object_graph_runtime.graph_classes import CaseGraph

router = APIRouter()

@router.get("/graph")
def get_graph():
    path_graph = r'C:\Users\henni\Desktop\Arbeit-Studium\my_agents\repos\legal_case_simulator\frontend\src\data\graph.json'

    loaded_graph = CaseGraph.from_json(path_graph)

    return loaded_graph.to_dict()