from backend.object_graph_runtime.graph_classes import CaseGraph

from backend.database.repositories.case_repository import CaseRepository
from backend.database.repositories.node_repository import NodeRepository
from backend.database.repositories.edge_repository import EdgeRepository
from backend.database.repositories.actor_repository import ActorRepository
from backend.database.repositories.artifact_repository import ArtifactRepository


class GraphRepository:

    def __init__(self):

        self.case_repo = CaseRepository()
        self.node_repo = NodeRepository()
        self.edge_repo = EdgeRepository()
        self.actor_repo = ActorRepository()
        self.artifact_repo = ArtifactRepository()

    # =========================================================
    # Save complete graph
    # =========================================================

    def save_graph(self, graph: CaseGraph):

        self.case_repo.upsert(graph.case)

        for actor in graph.actors.values():
            self.actor_repo.upsert(actor)

        for node in graph.nodes.values():
            self.node_repo.upsert(node)

        for edge in graph.edges.values():
            self.edge_repo.upsert(edge)

    # =========================================================
    # Load complete graph
    # =========================================================

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

    # =========================================================
    # Synchronize graph to MongoDB
    # =========================================================

    def sync_to_mongo(self, graph: CaseGraph):

        # -----------------------------------------------------
        # Save current graph objects
        # -----------------------------------------------------

        self.case_repo.upsert(graph.case)

        for actor in graph.actors.values():
            self.actor_repo.upsert(actor)

        for node in graph.nodes.values():
            self.node_repo.upsert(node)

        for edge in graph.edges.values():
            self.edge_repo.upsert(edge)

        # -----------------------------------------------------
        # Remove stale MongoDB objects
        # -----------------------------------------------------

        self._remove_deleted_nodes(graph)
        self._remove_deleted_edges(graph)
        self._remove_deleted_actors(graph)
        self._remove_unreferenced_artifacts(graph)

    def sync_from_mongo(self, case_id: str) -> CaseGraph:

        return self.load_graph(case_id)

    # =========================================================
    # Delete complete case
    # =========================================================

    def delete_case(self, case_id: str):

        self.case_repo.delete(case_id)

        self.node_repo.delete_by_case(case_id)
        self.edge_repo.delete_by_case(case_id)
        self.actor_repo.delete_by_case(case_id)
        self.artifact_repo.delete_by_case(case_id)

    # =========================================================
    # Individual save methods
    # =========================================================

    def save_node(self, node):

        self.node_repo.upsert(node)

    def save_edge(self, edge):

        self.edge_repo.upsert(edge)

    def save_actor(self, actor):

        self.actor_repo.upsert(actor)

    def save_artifact(self, artifact):

        self.artifact_repo.upsert(artifact)

    # =========================================================
    # Individual delete methods
    # =========================================================

    def delete_node(self, node):

        node_id = node.id if hasattr(node, "id") else node
        self.node_repo.delete(node_id)

    def delete_edge(self, edge):

        edge_id = edge.id if hasattr(edge, "id") else edge
        self.edge_repo.delete(edge_id)

    def delete_actor(self, actor):

        actor_id = actor.id if hasattr(actor, "id") else actor
        self.actor_repo.delete(actor_id)

    def delete_artifact(self, artifact):

        artifact_id = (
            artifact.id
            if hasattr(artifact, "id")
            else artifact
        )

        self.artifact_repo.delete(artifact_id)

    # =========================================================
    # Remove deleted nodes
    # =========================================================

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

    # =========================================================
    # Remove deleted edges
    # =========================================================

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

    # =========================================================
    # Remove deleted actors
    # =========================================================

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

    # =========================================================
    # Remove unreferenced artifacts
    # =========================================================

    def _remove_unreferenced_artifacts(
        self,
        graph: CaseGraph,
    ):

        case_id = graph.case.id

        # All artifacts currently stored for the case.
        mongo_artifacts = (
            self.artifact_repo.get_by_case(case_id)
        )

        # Artifact IDs that are still referenced somewhere
        # in the current graph.
        referenced_artifact_ids = (
            self._get_referenced_artifact_ids(graph)
        )

        for mongo_artifact in mongo_artifacts:

            if (
                mongo_artifact.id
                not in referenced_artifact_ids
            ):

                self.artifact_repo.delete(
                    mongo_artifact.id
                )

                print(
                    f"Deleted unreferenced artifact "
                    f"{mongo_artifact.id}"
                )

    def _get_referenced_artifact_ids(
        self,
        graph: CaseGraph,
    ) -> set[str]:

        referenced_artifact_ids: set[str] = set()

        # -----------------------------------------------------
        # Artifact references stored on node states
        # -----------------------------------------------------

        for node in graph.nodes.values():

            referenced_artifact_ids.update(
                node.state.artifact_ids
            )

        # -----------------------------------------------------
        # Artifact references stored on edges
        # -----------------------------------------------------

        for edge in graph.edges.values():

            referenced_artifact_ids.update(
                edge.artifact_ids
            )

        return referenced_artifact_ids