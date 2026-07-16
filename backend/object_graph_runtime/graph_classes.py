from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, List, Any
from enum import Enum
import uuid
import json
from datetime import datetime, timezone


# -------------------------
# Helpers
# -------------------------
def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


# -------------------------
# Case Model
# -------------------------
class Language(str, Enum):
    GERMAN = "de"
    ENGLISH = "en"
    FRENCH  = "fr"

class AppliedLaw(str, Enum):
    GERMAN = "de"
    US = "us"

class Case(BaseModel):
    id: str
    owner_id: str
    title: str
    created_at: str
    language: Language = Language.ENGLISH
    applied_law: AppliedLaw = AppliedLaw.GERMAN

# -------------------------
# Artifact Model
# -------------------------
class Artifact(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(description='Unique identifier for the artifact')
    case_id: str = Field(description='Case ID of the artifact')

    type: str = Field(description='Type of the artifact (e.g., document, evidence, testimony)')
    title: str = Field(description='Title or brief description of the artifact, e.g., "Contract between A and B"')

    source_type: str = Field(description='Source type of the artifact (e.g., uploaded, generated, external)')
    original_filename: Optional[str] = Field(default=None, description='If the artifact was uploaded, this is the '
                                                                       'original filename of the uploaded file')
    original_file_url: Optional[str] = Field(default=None, description='If the artifact was uploaded, this is the URL '
                                                                       'or path to the ')

    extracted_content: Optional[str] = Field(default=None, description='Content parsed from original document, if applicable')
    content: str = Field(description='Full content of the artifact')
    created_by: Optional[str] = Field(default=None, description='ID of the actor who created the artifact '
                                                                '(Person, court, lawyer etc.)')

    timestamp_created: str = Field(default_factory=utc_now, description='Timestamp of when the artifact was created in ISO 8601 format')
    timestamp_uploaded: Optional[str] = Field(default_factory=utc_now,
                           description='Timestamp of when the original document was uploaded in ISO 8601 format')

class ArtifactCollection(BaseModel):
    artifacts: List[Artifact]

# -------------------------
# Graph Components
# -------------------------
class Actor(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(description='Unique identifier for the actor')
    case_id: str = Field(description='Case ID of the edge')
    name: str = Field(description='Name of the actor')
    role: str = Field(description='Role of the actor in the legal case '
                                  '(e.g., plaintiff, defendant, judge, lawyer, court)')
    gender: Optional[str] = Field(default=None, description='Gender of the actor, if applicable')
    age: Optional[int] = Field(default=None, description='Age of the actor, if applicable')
    nationality: Optional[str] = Field(default=None, description='Nationality of the actor, if applicable')
    profession: Optional[str] = Field(default=None, description='Profession of the actor, if applicable')
    background: Optional[str] = Field(default=None, description='Background information of the actor, if applicable')


class ActorStatus(BaseModel):
    model_config = ConfigDict(extra="forbid")

    actor: Actor = Field(description='Actor of the status')
    paid: int = Field(description='Sum of paid money for services to lawyers, courts etc.')
    received: int = Field(description='Sum of received money from other actors, refunds etc.')


class LegalReference(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str = Field(description='Type of reference, e.g. law, policy etc.')
    reference: str = Field(description='Legal reference e.g.: § 433 BGB – Vertragstypische Pflichten beim Kaufvertrag')
    extract: str = Field(description='Long extract of the reference from the source')
    summary: str = Field(description='Summary of the reference')


class Deadline(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str = Field(description='Type of deadline')
    references: LegalReference = Field(description='Legal references that causes the deadline, law, time limit set by actor')
    summary: str = Field(description='Summary and background info of deadline')
    due_date: str = Field(default_factory=utc_now, description='Due date in ISO 8601 format')


class LegalEdge(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(description='Unique identifier for the edge')
    case_id: str = Field(description='Case ID of the edge')
    source_id: str = Field(description='ID of the source node')
    target_id: str = Field(description='ID of the target node')

    start_time: str = Field(default_factory=utc_now, description='Start time of this action in ISO 8601 format. '
                                                                 'Begins with end of previous state.')
    end_time: str = Field(default_factory=utc_now, description='End time of this action in ISO 8601 format. '
                                                                 'End time is equal to start of following state.')

    action_type: str = Field(description='Type of legal action or event that this edge represents '
                                         '(e.g., file_complaint, submit_evidence, hold_hearing)')
    actor_id: Optional[str] = Field(default=None, description='ID of the actor responsible for this '
                                                              'action, if applicable')
    artifact_ids: List[str] = Field(default_factory=list, description='List of artifacts ids associated '
                                                                        'with this legal action, if applicable')

    probability: float = Field(default=1.0, description='Probability of this legal action is carried out successfully, if applicable')
    conditions: List[str] = Field(default_factory=list, description='List of conditions for the action to be carried out, e.g.'
                                                                    'person above 18 years, actor has no criminal recors,'
                                                                    'employment relationship lasting longer than 6 months etc.')
    legal_references: List[LegalReference] = Field(default_factory=list, description='List of legal references that '
                                                                                     'are relevant for the action.')
    lawyer_involved: bool = Field(description='Flag to indicate if lawyer is involved in this action')


class LegalState(BaseModel):
    model_config = ConfigDict(extra="forbid")

    start_time: str = Field(default_factory=utc_now, description='Start time of this state in ISO 8601 format. '
                                                                 'Begins with end of previous action.')
    end_time: str = Field(default_factory=utc_now, description='End time of this state in ISO 8601 format. '
                                                                 'End time is equal to start of following action.')
    description: str = Field(description='Detailed description of the state referring to the previous steps and describing '
                                    'the state of all actors.')
    legal_issue: str = Field(description='The legal issue that follows from the state, e.g. payment overdue according to law')
    final_state: bool = Field(description='Bool to indicate if this step is the last step in the legal process')
    actors_status: List[ActorStatus] = Field(default_factory=list, description='Status of each actor that '
                                                                               'is relevant for the legal state.')
    legal_references: List[LegalReference] = Field(default_factory=list, description='List of legal references that '
                                                                                     'are relevant for the case and '
                                                                                     'current state of the process')
    artifact_ids: List[str] = Field(default_factory=list, description='List of artifacts associated '
                                                                        'with this legal state, like contracts, '
                                                                        'dunning letter, emails etc.')
    deadlines: List[Deadline] = Field(default_factory=list, description='List of deadlines related to the state, can '
                                                                        'include response deadlines etc.')
    potential_next_states: List[str] = Field(default_factory=list, description='List of potential next states that '
                                                                               'can follow from this state')


class LegalNode(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(description='Unique identifier for the node')
    case_id: str = Field(description='Case ID of the node')
    incoming: List[str] = Field(default_factory=list, description='List of incoming edge IDs that lead to this node')
    outgoing: List[str] = Field(default_factory=list, description='List of outgoing edge IDs that '
                                                                  'lead to successor nodes')

    number: Optional[str] = Field(
        default=None,
        description="Dynamic human-readable number derived from the graph structure",
    )

    title: str = Field(description='Title or brief description of the legal state or event represented by this node')
    state: LegalState = Field(description='Structured representation of the legal state at this node, can include relevant '
                                                 'facts, legal issues, etc.')

    summary: str = Field(description='Narrative summary of the legal state or event at this node, '
                                     'for human-readable context')


class LegalBranchNode(BaseModel):
    model_config = ConfigDict(extra="forbid")

    edge: LegalEdge = Field(description='The edge representing the transition to this branch')
    node: LegalNode = Field(description='The node representing the legal state at the end of this branch')


class LegalBranches(BaseModel):
    model_config = ConfigDict(extra="forbid")

    branches: list[LegalBranchNode] = Field(description='List of possible branches (transitions)'
                                                        ' from a given legal state')


class PathStep(BaseModel):
    node_id: str = Field(description='ID of the node at this step in the path')
    event_type: Optional[str] = Field(description='Action that led to this state')
    actor_id: Optional[str] = Field(description='Actor responsible for the action that led to this state')
    state_snapshot: LegalState = Field(description='Snapshot of the legal state at this step')
    summary: str = Field(description='Narrative summary of the legal state at this step')


# -------------------------
# Graph Engine (non-Pydantic)
# -------------------------
class CaseGraph:
    def __init__(self):
        self.case: Case = Case(id=generate_id("case"), owner_id='111',    #generate_id("owner"),
                               title='my_case', created_at = utc_now())
        self.nodes: dict[str, LegalNode] = {}
        self.edges: dict[str, LegalEdge] = {}
        self.actors: dict[str, Actor] = {}

    def set_case_title(self, title):
        self.case.title = title

    # -------------------------
    # Actor
    # -------------------------
    def add_actor(self, name: str, role: str) -> Actor:
        actor = Actor(id=generate_id("actor"), name=name, role=role)
        actor.case_id = self.case.id
        self.actors[actor.id] = actor
        return actor

    def add_actor_obj(self, actor: Actor) -> Actor:
        actor.case_id = self.case.id
        self.actors[actor.id] = actor
        return actor

    # -------------------------
    # Node
    # -------------------------
    def add_node(self, title: str, state: LegalState, summary: str = "") -> LegalNode:
        node = LegalNode(
            id=generate_id("node"),
            title=title,
            state=state,
            summary=summary,
        )
        node.case_id = self.case.id
        self.nodes[node.id] = node
        return node

    def add_node_obj(self, node: LegalNode) -> LegalNode:
        node.case_id = self.case.id
        self.nodes[node.id] = node
        return node

    def get_node(self, node_id: str) -> LegalNode:
        if node_id not in self.nodes:
            raise KeyError(f"Node '{node_id}' does not exist")
        return self.nodes[node_id]

    def node_to_dict(self, node_id: str) -> dict:
        node = self.get_node(node_id)
        return node.model_dump()

    # -------------------------
    # Edge
    # -------------------------
    def get_outgoing_edges(self, node_id: str) -> list[LegalEdge]:
        node = self.get_node(node_id)

        return [
            self.edges[edge_id]
            for edge_id in node.outgoing
        ]

    def get_incoming_edges(self, node_id: str) -> list[LegalEdge]:
        node = self.get_node(node_id)

        return [
            self.edges[edge_id]
            for edge_id in node.incoming
        ]


    def add_edge(
        self,
        source_id: str,
        target_id: str,
        start_time: str,
        end_time: str,
        action_type: str,
        artifacts: Optional[List[Artifact]] = None,
        actor_id: Optional[str] = None,
        probability: float = 1.0,
        conditions: Optional[List[str]] = None,
        legal_references: Optional[List[LegalReference]] = None,
        lawyer_involved: bool =False,
    ) -> LegalEdge:

        edge = LegalEdge(
            id=generate_id("edge"),
            case_id=self.case.id,
            source_id=source_id,
            target_id=target_id,
            start_time= start_time,
            end_time=end_time,
            action_type=action_type,
            artifacts=artifacts or [],
            actor_id=actor_id,
            probability=probability,
            conditions=conditions or [],
            legal_references=legal_references or [],
            lawyer_involved = lawyer_involved
        )

        self.edges[edge.id] = edge

        # link nodes safely
        self.nodes[source_id].outgoing.append(edge.id)
        self.nodes[target_id].incoming.append(edge.id)

        return edge

    # -------------------------
    # Branch
    # -------------------------
    def get_branch_of_node(self, node_id) -> LegalBranchNode:

        node = self.get_node(node_id)
        if len(node.incoming) != 1:
            raise Exception('Branch for multiple predecessors not defined')
        edge = self.get_incoming_edges(node_id)[0]

        return LegalBranchNode(node=node, edge=edge)

    def add_branch_obj(self, source_id: str, branch_node: LegalBranchNode) -> LegalBranchNode:

        # Add the node with unique id
        branch_node.node.id = generate_id("node")
        branch_node.node.case_id = self.case.id
        self.nodes[branch_node.node.id] = branch_node.node

        # Add the edge with unique id
        branch_node.edge.id = generate_id("edge")
        branch_node.edge.case_id = self.case.id
        branch_node.edge.target_id = branch_node.node.id
        branch_node.edge.source_id = source_id
        self.edges[branch_node.edge.id] = branch_node.edge

        # link nodes safely
        self.nodes[source_id].outgoing.append(branch_node.edge.id)
        self.nodes[branch_node.node.id].incoming = [branch_node.edge.id]

        self.update_node_numbers()

        return branch_node

    def update_branch_obj(self, branch_node: LegalBranchNode) -> None:
        """
        Update an existing branch (edge + node) using the IDs contained
        in branch_node.edge.id and branch_node.node.id.

        Raises:
            KeyError: if the node or edge does not exist.
        """

        node_id = branch_node.node.id
        edge_id = branch_node.edge.id

        if node_id not in self.nodes:
            raise KeyError(f"Node '{node_id}' does not exist")

        if edge_id not in self.edges:
            raise KeyError(f"Edge '{edge_id}' does not exist")

        # Preserve graph linkage information
        incoming = self.nodes[node_id].incoming
        outgoing = self.nodes[node_id].outgoing

        source_id = self.edges[edge_id].source_id
        target_id = self.edges[edge_id].target_id

        # Replace node contents
        updated_node = branch_node.node.model_copy(deep=True)
        updated_node.incoming = incoming
        updated_node.outgoing = outgoing
        self.nodes[node_id] = updated_node

        # Replace edge contents
        updated_edge = branch_node.edge.model_copy(deep=True)
        updated_edge.source_id = source_id
        updated_edge.target_id = target_id
        self.edges[edge_id] = updated_edge

    # -------------------------
    # Delete
    # -------------------------
    def delete_node(self, node_id: str) -> None:
        if node_id not in self.nodes:
            raise KeyError(f"Node '{node_id}' does not exist")

        # 1. Collect all nodes to delete (including root)
        to_delete_nodes = {node_id}

        successors = self.get_successor_nodes(node_id)
        to_delete_nodes.update(n.id for n in successors)

        # 2. Collect edges to delete
        to_delete_edges = set()

        for nid in to_delete_nodes:
            node = self.nodes[nid]
            to_delete_edges.update(node.incoming)
            to_delete_edges.update(node.outgoing)

        # 3. Remove edges from graph
        for eid in to_delete_edges:
            if eid in self.edges:
                edge = self.edges[eid]

                # clean references in connected nodes (if they still exist)
                if edge.source_id in self.nodes:
                    if eid in self.nodes[edge.source_id].outgoing:
                        self.nodes[edge.source_id].outgoing.remove(eid)

                if edge.target_id in self.nodes:
                    if eid in self.nodes[edge.target_id].incoming:
                        self.nodes[edge.target_id].incoming.remove(eid)

                del self.edges[eid]

        # 4. Remove nodes
        for nid in to_delete_nodes:
            if nid in self.nodes:
                del self.nodes[nid]

        # 5. Recalculate display numbers
        if self.nodes:
            self.update_node_numbers()


    # -------------------------
    # Traversal
    # -------------------------
    def get_successors(self, node_id: str) -> list[LegalNode]:
        node = self.nodes[node_id]
        return [
            self.nodes[self.edges[eid].target_id]
            for eid in node.outgoing
        ]

    def get_predecessors(self, node_id: str) -> list[LegalNode]:
        node = self.nodes[node_id]
        return [
            self.nodes[self.edges[eid].source_id]
            for eid in node.incoming
        ]

    def get_successor_nodes(self, node_id: str) -> list[LegalNode]:
        visited = set()
        result = []

        def dfs(nid: str):
            for eid in self.nodes[nid].outgoing:
                edge = self.edges[eid]
                target_id = edge.target_id

                if target_id in visited:
                    continue

                visited.add(target_id)
                result.append(self.nodes[target_id])
                dfs(target_id)

        dfs(node_id)
        return result

    def get_neighbour_nodes(self, node_id: str) -> list[LegalNode]:

        try:
            node = self.get_node(node_id)
        except:
            return []

        # Root node has no parent
        if not node.incoming:
            return []

        # Get parent via first incoming edge
        parent_edge = self.edges[node.incoming[0]]
        parent_id = parent_edge.source_id

        parent_node = self.nodes[parent_id]

        neighbours = []

        for edge_id in parent_node.outgoing:
            edge = self.edges[edge_id]

            if edge.target_id != node_id:
                neighbours.append(self.nodes[edge.target_id])

        return neighbours

    # -------------------------
    # Artifacts
    # -------------------------
    def add_artifact(self, artifact: Artifact, edge_id: str) -> Artifact:

        # Add the artifact with unique id
        artifact.id = generate_id("art")

        self.edges[edge_id].artifact_ids.append(artifact.id)
        self.nodes[self.edges[edge_id].target_id].state.artifact_ids.append(artifact.id)

        return artifact

    # -------------------------
    # Serialization (Pydantic-native)
    # -------------------------
    def to_dict(self) -> dict:
        return {
            "case": self.case.model_dump(),
            "nodes": {nid: node.model_dump() for nid, node in self.nodes.items()},
            "edges": {eid: edge.model_dump() for eid, edge in self.edges.items()},
            "actors": {aid: actor.model_dump() for aid, actor in self.actors.items()},
        }

    def to_json(self, path: str) -> None:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)

    # -------------------------
    # Deserialization
    # -------------------------
    @classmethod
    def from_dict(cls, data: dict) -> "CaseGraph":
        graph = cls()

        # Restore case
        graph.case = Case.model_validate(data.get("case", {}))

        # Restore actors
        graph.actors = {
            aid: Actor.model_validate(actor_data)
            for aid, actor_data in data.get("actors", {}).items()
        }

        # Restore nodes
        graph.nodes = {
            nid: LegalNode.model_validate(node_data)
            for nid, node_data in data.get("nodes", {}).items()
        }

        # Restore edges
        graph.edges = {
            eid: LegalEdge.model_validate(edge_data)
            for eid, edge_data in data.get("edges", {}).items()
        }

        return graph

    @classmethod
    def from_json(cls, path: str) -> "CaseGraph":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return cls.from_dict(data)

    # -------------------------
    # Build path
    # -------------------------
    def build_path(self, node_id: str) -> List[PathStep]:
        path = []
        visited = set()

        current_id = node_id

        while current_id and current_id not in visited:
            visited.add(current_id)

            node = self.nodes[current_id]

            # find incoming edge (assuming single-parent path per branch)
            incoming_edges = [
                self.edges[eid]
                for eid in node.incoming
            ]

            edge = incoming_edges[0] if incoming_edges else None

            step = PathStep(
                node_id=node.id,
                event_type=edge.action_type if edge else None,
                actor_id=edge.actor_id if edge else None,
                state_snapshot=node.state,
                summary=node.summary
            )

            path.insert(0, step)

            if edge:
                current_id = edge.source_id
            else:
                break

        return path

    # -------------------------
    # Build narrative
    # -------------------------
    def build_narrative(self, path: List[PathStep]) -> str:

        text = []
        for i, step in enumerate(path):

            if i == 0:
                text.append(f"Case begins: {step.summary}")
                continue

            action = step.event_type
            actor = step.actor_id or "unknown actor"

            text.append(
                f"{actor} executed '{action}', resulting in: {step.summary}"
            )

        return "\n".join(text)

    # -------------------------
    # Get path info (payment info and state periods)
    # -------------------------
    def get_path_info(self, node_id: str) -> dict:

        path = self.build_path(node_id)
        payment_info = {}
        state_periods = {}
        state_counter = {}

        # -------------------------
        # Payment information
        # -------------------------
        for actor_status in self.get_node(node_id).state.actors_status:
            actor_name = actor_status.actor.name

            payment_info[actor_name] = {
                "paid": actor_status.paid,
                "received": actor_status.received,
            }

        for step in path:
            state = step.state_snapshot
            node = self.nodes[step.node_id]

            # -------------------------
            # State periods
            # -------------------------
            state_name = node.title

            state_counter[state_name] = state_counter.get(state_name, 0) + 1

            if state_counter[state_name] > 1:
                state_name = f"{state_name} [{state_counter[state_name]}]"

            state_periods[state_name] = {
                "start": state.start_time,
                "end": state.end_time,
            }

        return {
            "payment_info": payment_info,
            "state_periods": state_periods,
        }
    # -------------------------
    # Node numbering (not th ID, but the hierarchical display number)
    # -------------------------
    def update_node_numbers(self) -> None:
        """
        Recalculate compact display numbers for all nodes.

        Numbering rules
        ---------------
        A linear sequence increments only the step number:

            A-01
            A-02
            A-03

        When a node has multiple outgoing edges, each child starts
        a new branch segment:

            A-03
            ├── A1-01
            └── A2-01

        Linear nodes inside those branches continue incrementing:

            A1-01
            A1-02
            A1-03

        A later nested branch introduces another branch level:

            A1-03
            ├── A1.1-01
            └── A1.2-01

        The sibling order is determined by the order of edge IDs in
        the parent's `outgoing` list.

        Raises
        ------
        ValueError
            If the graph has no root, multiple roots, cycles,
            disconnected nodes, invalid edges, or nodes with multiple
            parents.
        """

        if not self.nodes:
            return

        # Reset old display numbers before recalculating.
        for node in self.nodes.values():
            node.number = None

        # This numbering describes one unique path per node.
        # Therefore, every non-root node must have exactly one parent.
        nodes_with_multiple_parents = [
            node.id
            for node in self.nodes.values()
            if len(node.incoming) > 1
        ]

        if nodes_with_multiple_parents:
            raise ValueError(
                "Cannot assign unique path numbers because the following "
                "nodes have multiple parents: "
                f"{sorted(nodes_with_multiple_parents)}"
            )

        roots = [
            node
            for node in self.nodes.values()
            if len(node.incoming) == 0
        ]

        if not roots:
            raise ValueError(
                "Cannot number graph because no root node was found. "
                "The graph may contain a cycle."
            )

        if len(roots) > 1:
            raise ValueError(
                "Cannot number graph because more than one root node was found: "
                f"{sorted(node.id for node in roots)}"
            )

        root = roots[0]

        visited: set[str] = set()
        active_path: set[str] = set()

        def format_number(
            branch_path: tuple[int, ...],
            step_number: int,
        ) -> str:
            """
            Convert internal numbering information to the display format.

            Examples:
                ()       + 3 -> A-03
                (1,)     + 2 -> A1-02
                (2,)     + 7 -> A2-07
                (1, 2)   + 4 -> A1.2-04
            """

            if not branch_path:
                branch_code = "A"
            else:
                first_branch = str(branch_path[0])
                nested_branches = "".join(
                    f".{branch_number}"
                    for branch_number in branch_path[1:]
                )

                branch_code = f"A{first_branch}{nested_branches}"

            return f"{branch_code}-{step_number:02d}"

        def get_valid_outgoing_edges(node: LegalNode) -> list[LegalEdge]:
            """
            Return outgoing edges in their stored order and validate them.
            """

            outgoing_edges = []

            for edge_id in node.outgoing:
                if edge_id not in self.edges:
                    raise ValueError(
                        f"Node '{node.id}' references missing outgoing "
                        f"edge '{edge_id}'."
                    )

                edge = self.edges[edge_id]

                if edge.source_id != node.id:
                    raise ValueError(
                        f"Outgoing edge '{edge.id}' is stored on node "
                        f"'{node.id}', but its source is '{edge.source_id}'."
                    )

                if edge.target_id not in self.nodes:
                    raise ValueError(
                        f"Edge '{edge.id}' points to missing target node "
                        f"'{edge.target_id}'."
                    )

                outgoing_edges.append(edge)

            return outgoing_edges

        def assign_number(
            node_id: str,
            branch_path: tuple[int, ...],
            step_number: int,
        ) -> None:
            if node_id in active_path:
                raise ValueError(
                    f"Cannot number graph because a cycle was detected "
                    f"at node '{node_id}'."
                )

            if node_id in visited:
                raise ValueError(
                    f"Node '{node_id}' was reached more than once. "
                    "The graph is not a single-parent tree."
                )

            active_path.add(node_id)
            visited.add(node_id)

            node = self.nodes[node_id]

            node.number = format_number(
                branch_path=branch_path,
                step_number=step_number,
            )

            outgoing_edges = get_valid_outgoing_edges(node)

            if len(outgoing_edges) == 1:
                # Continue the same linear branch segment.
                edge = outgoing_edges[0]

                assign_number(
                    node_id=edge.target_id,
                    branch_path=branch_path,
                    step_number=step_number + 1,
                )

            elif len(outgoing_edges) > 1:
                # A real split occurred. Each child starts a new branch
                # segment and resets its local step counter to 1.
                for branch_index, edge in enumerate(
                    outgoing_edges,
                    start=1,
                ):
                    assign_number(
                        node_id=edge.target_id,
                        branch_path=branch_path + (branch_index,),
                        step_number=1,
                    )

            active_path.remove(node_id)

        assign_number(
            node_id=root.id,
            branch_path=(),
            step_number=1,
        )

        unvisited_nodes = set(self.nodes) - visited

        if unvisited_nodes:
            raise ValueError(
                "The following nodes are not reachable from the root node "
                f"'{root.id}': {sorted(unvisited_nodes)}"
            )


