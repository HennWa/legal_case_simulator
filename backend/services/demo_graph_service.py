# backend/services/demo_graph_service.py

from __future__ import annotations

from copy import deepcopy

from pymongo.errors import (
    DuplicateKeyError,
)

from backend.auth.models import User
from backend.database.repositories.artifact_repository import (
    ArtifactRepository,
)
from backend.database.repositories.case_repository import (
    CaseRepository,
)
from backend.database.repositories.graph_repository import (
    GraphRepository,
)
from backend.object_graph_runtime.graph_classes import (
    CaseGraph,
    generate_id,
    utc_now,
)


DEFAULT_DEMO_TEMPLATE_KEY = (
    "default_demo"
)

DEFAULT_DEMO_TEMPLATE_VERSION = 1


class DemoGraphService:
    """
    Creates independent user-owned copies of the
    canonical Casendra demo graph.

    The canonical template is never modified.

    Once cloned, the resulting graph is a completely
    normal CaseGraph and can be changed or deleted by
    the user.
    """

    def __init__(self):
        self.graph_repository = (
            GraphRepository()
        )

        self.case_repository = (
            CaseRepository()
        )

        self.artifact_repository = (
            ArtifactRepository()
        )

    # =========================================================
    # Public API
    # =========================================================

    def ensure_demo_graph_for_user(
        self,
        user: User,
    ):
        """
        Ensure that the user has exactly one copy of
        the default demo template.

        The method is intentionally idempotent.

        Calling it multiple times returns the existing
        copy instead of creating additional demo cases.
        """

        existing_case = (
            self.case_repository
            .get_user_template_copy(
                owner_id=user.id,
                template_key=(
                    DEFAULT_DEMO_TEMPLATE_KEY
                ),
                template_version=(
                    DEFAULT_DEMO_TEMPLATE_VERSION
                ),
            )
        )

        if existing_case is not None:
            return existing_case

        template_case = (
            self.case_repository
            .get_template(
                template_key=(
                    DEFAULT_DEMO_TEMPLATE_KEY
                ),
                template_version=(
                    DEFAULT_DEMO_TEMPLATE_VERSION
                ),
            )
        )

        if template_case is None:
            raise RuntimeError(
                "Default demo graph template "
                "does not exist. "
                f"Expected template_key="
                f"'{DEFAULT_DEMO_TEMPLATE_KEY}', "
                f"template_version="
                f"{DEFAULT_DEMO_TEMPLATE_VERSION}."
            )

        template_graph = (
            self.graph_repository
            .load_graph(
                template_case.id
            )
        )

        template_artifacts = (
            self.artifact_repository
            .get_by_case(
                template_case.id
            )
        )

        if template_case.template_key is None:
            raise RuntimeError(
                "Template has no template_key."
            )

        if template_case.template_version is None:
            raise RuntimeError(
                "Template has no template_version."
            )

        user_graph, user_artifacts = (
            self._clone_graph(
                template_graph=(
                    template_graph
                ),
                template_artifacts=(
                    template_artifacts
                ),
                owner_id=user.id,
                template_key=(
                    template_case.template_key
                ),
                template_version=(
                    template_case.template_version
                ),
            )
        )

        try:
            self.graph_repository.save_graph(
                user_graph
            )

            for artifact in user_artifacts:
                self.artifact_repository.upsert(
                    artifact
                )

        except DuplicateKeyError:
            # Another request may have provisioned
            # the demo concurrently.
            #
            # Return that graph instead.
            existing_case = (
                self.case_repository
                .get_user_template_copy(
                    owner_id=user.id,
                    template_key=(
                        DEFAULT_DEMO_TEMPLATE_KEY
                    ),
                    template_version=(
                        DEFAULT_DEMO_TEMPLATE_VERSION
                    ),
                )
            )

            if existing_case is not None:
                return existing_case

            raise

        return user_graph.case

    # ---------------------------------------------------------
    # Create template from case
    # ---------------------------------------------------------

    def create_template_from_case(
            self,
            *,
            source_case_id: str,
            template_key: str,
            template_version: int,
            template_title: str | None = None,
    ):
        """
        Create a new canonical graph template from an
        existing normal Casendra case.

        The source case itself is never modified.

        All case, node, edge, actor and artifact IDs are
        regenerated so that the template is completely
        independent of the source graph.
        """

        # ---------------------------------------------------------
        # Validate source case
        # ---------------------------------------------------------

        source_case = (
            self.case_repository.get(
                source_case_id
            )
        )

        if source_case is None:
            raise ValueError(
                f"Source case '{source_case_id}' "
                "does not exist."
            )

        if source_case.is_template:
            raise ValueError(
                f"Source case '{source_case_id}' "
                "is already a template."
            )

        # ---------------------------------------------------------
        # Prevent duplicate canonical template
        # ---------------------------------------------------------

        existing_template = (
            self.case_repository
            .get_template(
                template_key=template_key,
                template_version=(
                    template_version
                ),
            )
        )

        if existing_template is not None:
            raise ValueError(
                "A template already exists with "
                f"template_key='{template_key}' "
                f"and template_version="
                f"{template_version}. "
                f"Existing case ID: "
                f"'{existing_template.id}'."
            )

        # ---------------------------------------------------------
        # Load complete source graph
        # ---------------------------------------------------------

        source_graph = (
            self.graph_repository
            .load_graph(
                source_case_id
            )
        )

        source_artifacts = (
            self.artifact_repository
            .get_by_case(
                source_case_id
            )
        )

        # ---------------------------------------------------------
        # Clone graph
        #
        # _clone_graph requires an owner because it normally
        # creates user-owned demo copies.
        #
        # We temporarily use the source owner and convert the
        # resulting copy into an ownerless template below.
        # ---------------------------------------------------------

        template_graph, template_artifacts = (
            self._clone_graph(
                template_graph=source_graph,
                template_artifacts=(
                    source_artifacts
                ),
                owner_id=(
                        source_case.owner_id
                        or "template_creation"
                ),
                template_key=(
                    template_key
                ),
                template_version=(
                    template_version
                ),
            )
        )

        # ---------------------------------------------------------
        # Convert cloned graph into canonical template
        # ---------------------------------------------------------

        template_graph.case.owner_id = None

        template_graph.case.is_template = True

        template_graph.case.is_active_template = True

        template_graph.case.template_key = (
            template_key
        )

        template_graph.case.template_version = (
            template_version
        )

        if template_title is not None:
            template_graph.case.title = (
                template_title.strip()
            )
        else:
            template_graph.case.title = (
                source_case.title
            )

        # ---------------------------------------------------------
        # Persist
        # ---------------------------------------------------------

        try:
            self.graph_repository.save_graph(
                template_graph
            )

            for artifact in template_artifacts:
                self.artifact_repository.upsert(
                    artifact
                )

        except Exception:
            # Avoid leaving an incomplete template behind
            # if persistence fails part-way through.
            self.graph_repository.delete_case(
                template_graph.case.id
            )

            raise

        return template_graph.case

    # =========================================================
    # Clone complete graph
    # =========================================================

    def _clone_graph(
                self,
                *,
                template_graph: CaseGraph,
                template_artifacts: list,
                owner_id: str,
                template_key: str,
                template_version: int,
        ):
        """
        Deep-copy a template graph and regenerate every
        database identity.

        All references to case, node, edge, actor and
        artifact IDs are rewritten to the new IDs.
        """

        graph = deepcopy(
            template_graph
        )

        artifacts = deepcopy(
            template_artifacts
        )

        old_case_id = (
            template_graph.case.id
        )

        new_case_id = generate_id(
            "case"
        )

        # -----------------------------------------------------
        # ID mappings
        # -----------------------------------------------------

        actor_id_map = {
            old_actor_id: generate_id(
                "actor"
            )
            for old_actor_id
            in template_graph.actors
        }

        node_id_map = {
            old_node_id: generate_id(
                "node"
            )
            for old_node_id
            in template_graph.nodes
        }

        edge_id_map = {
            old_edge_id: generate_id(
                "edge"
            )
            for old_edge_id
            in template_graph.edges
        }

        artifact_id_map = {
            artifact.id: generate_id(
                "artifact"
            )
            for artifact
            in template_artifacts
        }

        # -----------------------------------------------------
        # Case
        # -----------------------------------------------------

        graph.case.id = new_case_id
        graph.case.owner_id = owner_id
        graph.case.created_at = utc_now()

        graph.case.title = (
            f"Demo – {template_graph.case.title}"
        )

        graph.case.is_template = False

        graph.case.template_key = (
            template_key
        )

        graph.case.template_version = (
            template_version
        )

        graph.case.is_active_template = False

        # -----------------------------------------------------
        # Actors
        # -----------------------------------------------------

        new_actors = {}

        for (
            old_actor_id,
            actor,
        ) in graph.actors.items():

            actor.id = (
                actor_id_map[
                    old_actor_id
                ]
            )

            actor.case_id = (
                new_case_id
            )

            new_actors[
                actor.id
            ] = actor

        graph.actors = new_actors

        # -----------------------------------------------------
        # Nodes
        # -----------------------------------------------------

        new_nodes = {}

        for (
            old_node_id,
            node,
        ) in graph.nodes.items():

            node.id = (
                node_id_map[
                    old_node_id
                ]
            )

            node.case_id = (
                new_case_id
            )

            node.incoming = [
                edge_id_map[edge_id]
                for edge_id
                in node.incoming
            ]

            node.outgoing = [
                edge_id_map[edge_id]
                for edge_id
                in node.outgoing
            ]

            # ----------------------------------------------
            # Artifact references stored on state
            # ----------------------------------------------

            node.state.artifact_ids = [
                artifact_id_map[
                    artifact_id
                ]
                for artifact_id
                in node.state.artifact_ids
                if artifact_id
                in artifact_id_map
            ]

            # ----------------------------------------------
            # Embedded actors inside ActorStatus
            # ----------------------------------------------

            for actor_status in (
                node.state.actors_status
            ):
                old_actor_id = (
                    actor_status.actor.id
                )

                if (
                    old_actor_id
                    not in actor_id_map
                ):
                    raise ValueError(
                        "Demo template contains "
                        "an ActorStatus referencing "
                        f"unknown actor "
                        f"'{old_actor_id}'."
                    )

                new_actor_id = (
                    actor_id_map[
                        old_actor_id
                    ]
                )

                actor_status.actor = (
                    graph.actors[
                        new_actor_id
                    ]
                    .model_copy(
                        deep=True
                    )
                )

            new_nodes[
                node.id
            ] = node

        graph.nodes = new_nodes

        # -----------------------------------------------------
        # Edges
        # -----------------------------------------------------

        new_edges = {}

        for (
            old_edge_id,
            edge,
        ) in graph.edges.items():

            edge.id = (
                edge_id_map[
                    old_edge_id
                ]
            )

            edge.case_id = (
                new_case_id
            )

            edge.source_id = (
                node_id_map[
                    edge.source_id
                ]
            )

            edge.target_id = (
                node_id_map[
                    edge.target_id
                ]
            )

            if edge.actor_id is not None:
                if (
                    edge.actor_id
                    not in actor_id_map
                ):
                    raise ValueError(
                        "Demo template edge "
                        f"'{old_edge_id}' "
                        "references unknown actor "
                        f"'{edge.actor_id}'."
                    )

                edge.actor_id = (
                    actor_id_map[
                        edge.actor_id
                    ]
                )

            edge.artifact_ids = [
                artifact_id_map[
                    artifact_id
                ]
                for artifact_id
                in edge.artifact_ids
                if artifact_id
                in artifact_id_map
            ]

            new_edges[
                edge.id
            ] = edge

        graph.edges = new_edges

        # -----------------------------------------------------
        # Artifacts
        # -----------------------------------------------------

        for artifact in artifacts:

            old_artifact_id = (
                artifact.id
            )

            artifact.id = (
                artifact_id_map[
                    old_artifact_id
                ]
            )

            artifact.case_id = (
                new_case_id
            )

            if artifact.node_id:
                if (
                    artifact.node_id
                    not in node_id_map
                ):
                    raise ValueError(
                        "Demo template artifact "
                        f"'{old_artifact_id}' "
                        "references unknown node "
                        f"'{artifact.node_id}'."
                    )

                artifact.node_id = (
                    node_id_map[
                        artifact.node_id
                    ]
                )

            if artifact.created_by:
                if (
                    artifact.created_by
                    in actor_id_map
                ):
                    artifact.created_by = (
                        actor_id_map[
                            artifact.created_by
                        ]
                    )

            # Generated output files are deliberately
            # not assigned new IDs here.
            #
            # They refer to existing generated files.
            # If demo templates later contain actual
            # user-specific files, file duplication
            # should be handled by a dedicated storage
            # service.

        # -----------------------------------------------------
        # Safety validation
        # -----------------------------------------------------

        if graph.case.id == old_case_id:
            raise RuntimeError(
                "Graph clone failed to generate "
                "a new case ID."
            )

        return (
            graph,
            artifacts,
        )

    def clone_template_for_user(
            self,
            *,
            template_case,
            user: User,
    ):
        """
        Clone one canonical template for a user.

        The caller is responsible for deciding whether the
        user should receive this template.
        """

        if not template_case.is_template:
            raise ValueError(
                f"Case '{template_case.id}' "
                "is not a template."
            )

        if template_case.template_key is None:
            raise ValueError(
                f"Template '{template_case.id}' "
                "has no template_key."
            )

        if template_case.template_version is None:
            raise ValueError(
                f"Template '{template_case.id}' "
                "has no template_version."
            )

        # ---------------------------------------------------------
        # Existing user copy
        # ---------------------------------------------------------

        existing_case = (
            self.case_repository
            .get_user_template_copy_by_key(
                owner_id=user.id,
                template_key=(
                    template_case.template_key
                ),
            )
        )

        if existing_case is not None:
            return existing_case

        # ---------------------------------------------------------
        # Load canonical graph
        # ---------------------------------------------------------

        template_graph = (
            self.graph_repository.load_graph(
                template_case.id
            )
        )

        template_artifacts = (
            self.artifact_repository
            .get_by_case(
                template_case.id
            )
        )

        # ---------------------------------------------------------
        # Clone
        # ---------------------------------------------------------

        user_graph, user_artifacts = (
            self._clone_graph(
                template_graph=(
                    template_graph
                ),
                template_artifacts=(
                    template_artifacts
                ),
                owner_id=user.id,
                template_key=(
                    template_case.template_key
                ),
                template_version=(
                    template_case.template_version
                ),
            )
        )

        try:
            self.graph_repository.save_graph(
                user_graph
            )

            for artifact in user_artifacts:
                self.artifact_repository.upsert(
                    artifact
                )

        except DuplicateKeyError:
            # Another /auth/me request may have completed
            # provisioning concurrently.
            existing_case = (
                self.case_repository
                .get_user_template_copy_by_key(
                    owner_id=user.id,
                    template_key=(
                        template_case.template_key
                    ),
                )
            )

            if existing_case is not None:
                return existing_case

            raise

        return user_graph.case

