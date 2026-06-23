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

        # save current graph
        self.case_repo.upsert(graph.case)

        for actor in graph.actors.values():
            self.actor_repo.upsert(actor)

        for node in graph.nodes.values():
            self.node_repo.upsert(node)

        for edge in graph.edges.values():
            self.edge_repo.upsert(edge)

        # remove stale objects
        self._remove_deleted_nodes(graph)
        self._remove_deleted_edges(graph)
        self._remove_deleted_actors(graph)

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

    def _remove_deleted_nodes(self, graph: CaseGraph):

        case_id = graph.case.id
        mongo_nodes = self.node_repo.get_by_case(case_id)
        graph_node_ids = set(graph.nodes.keys())

        for mongo_node in mongo_nodes:
            if mongo_node.id not in graph_node_ids:
                self.node_repo.delete(mongo_node.id)

                print(
                    f"Deleted stale node "
                    f"{mongo_node.id}"
                )

    def _remove_deleted_edges(self, graph: CaseGraph):

        case_id = graph.case.id
        mongo_edges = self.edge_repo.get_by_case(case_id)
        graph_edge_ids = set(graph.edges.keys())

        for mongo_edge in mongo_edges:
            if mongo_edge.id not in graph_edge_ids:
                self.edge_repo.delete(mongo_edge.id)

                print(
                    f"Deleted stale edge "
                    f"{mongo_edge.id}"
                )

    def _remove_deleted_actors(self, graph: CaseGraph):

        case_id = graph.case.id
        mongo_actors = self.actor_repo.get_by_case(case_id)
        graph_actor_ids = set(graph.actors.keys())

        for mongo_actor in mongo_actors:
            if mongo_actor.id not in graph_actor_ids:
                self.actor_repo.delete(mongo_actor.id)

                print(
                    f"Deleted stale actor "
                    f"{mongo_actor.id}"
                )

