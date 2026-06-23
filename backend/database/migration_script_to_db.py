import os
from utils.utils import get_frontend_dir
from object_graph_runtime.graph_classes import CaseGraph
from database.repositories.graph_repository import GraphRepository

print("migration to mongo db")

path_graph = os.path.join(get_frontend_dir(), 'src/data/graph.json')

graph = CaseGraph.from_json(path_graph)

repo = GraphRepository()

repo.save_graph(graph)

print("migration complete")