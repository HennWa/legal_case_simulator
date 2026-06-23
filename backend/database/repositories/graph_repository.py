from object_graph_runtime.graph_classes import CaseGraph

from database.repositories.case_repository import CaseRepository
from database.repositories.node_repository import NodeRepository
from database.repositories.edge_repository import EdgeRepository
from database.repositories.actor_repository import ActorRepository


class GraphRepository:

    def __init__(self):

        self.case_repo = CaseRepository()
        self.node_repo = NodeRepository()
        self.edge_repo = EdgeRepository()
        self.actor_repo = ActorRepository()

    def save_graph(self, graph: CaseGraph):

        self.case_repo.upsert(graph.case)

        for actor in graph.actors.values():
            self.actor_repo.upsert(actor)

        for node in graph.nodes.values():
            self.node_repo.upsert(node)

        for edge in graph.edges.values():
            self.edge_repo.upsert(edge)

    def load_graph(self, case_id: str) -> CaseGraph:

        graph = CaseGraph()

        graph.case = self.case_repo.get(case_id)

        graph.nodes = {
            node.id: node
            for node in self.node_repo.get_by_case(case_id)
        }

        graph.edges = {
            edge.id: edge
            for edge in self.edge_repo.get_by_case(case_id)
        }

        graph.actors = {
            actor.id: actor
            for actor in self.actor_repo.get_by_case(case_id)
        }

        return graph

    def sync_to_mongo(self, graph: CaseGraph):

        print(
            f"Syncing "
            f"{len(graph.nodes)} nodes, "
            f"{len(graph.edges)} edges"
        )

        self.save_graph(graph)

    def sync_from_mongo(self, case_id: str) -> CaseGraph:

        return self.load_graph(case_id)

    def delete_case(self, case_id: str):

        self.case_repo.delete(case_id)

        self.node_repo.delete_by_case(case_id)

        self.edge_repo.delete_by_case(case_id)

        self.actor_repo.delete_by_case(case_id)

    def save_node(self, node):
        self.node_repo.upsert(node)

    def save_edge(self, edge):
        self.edge_repo.upsert(edge)

    def save_actor(self, actor):
        self.actor_repo.upsert(actor)

    def delete_node(self, node):
        self.node_repo.delete(node)

    def delete_edge(self, edge):
        self.edge_repo.delete(edge)

    def delete_actor(self, actor):
        self.actor_repo.delete(actor)

