from fastapi import APIRouter
from object_graph_runtime.graph_classes import CaseGraph

router = APIRouter()

@router.get("/node/{node_id}")
def get_node(node_id: str):
    path_graph = r'C:\Users\henni\Desktop\Arbeit-Studium\my_agents\repos\legal_case_simulator\frontend\src\data\graph.json'

    loaded_graph = CaseGraph.from_json(path_graph)
    loaded_graph.node_to_dict(node_id)

    return loaded_graph.node_to_dict(node_id)