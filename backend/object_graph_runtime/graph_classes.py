from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, List, Any
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
# Core Models
# -------------------------
class Actor(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(description='Unique identifier for the actor')
    name: str = Field(description='Name of the actor')
    role: str = Field(description='Role of the actor in the legal case '
                                  '(e.g., plaintiff, defendant, judge, lawyer)')


class ActorStatus(BaseModel):
    model_config = ConfigDict(extra="forbid")

    actors: Actor = Field(description='Actor of the status')
    paid: int = Field(description='Sum of paid money for services to lawyers, courts etc.')
    received: int = Field(description='Sum of received money from other actors, refunds etc.')


class Artifact(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(description='Unique identifier for the artifact')
    type: str = Field(description='Type of the artifact (e.g., document, evidence, testimony)')
    content: str = Field(description='Content of the artifact, can be text or a reference to an external resource')
    created_by: Optional[str] = Field(default=None, description='ID of the actor who created the artifact')
    timestamp: str = Field(default_factory=utc_now, description='Timestamp of when the artifact was created in ISO 8601 format')


class LegalEdge(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(description='Unique identifier for the edge')
    source_id: str = Field(description='ID of the source node')
    target_id: str = Field(description='ID of the target node')

    action_type: str = Field(description='Type of legal action or event that this edge represents '
                                         '(e.g., file_complaint, submit_evidence, hold_hearing)')
    actor_id: Optional[str] = Field(default=None, description='ID of the actor responsible for this '
                                                              'action, if applicable')
    artifacts: List[Artifact] = Field(default_factory=list, description='List of artifacts associated '
                                                                        'used in this transition, if applicable')

    probability: float = Field(default=1.0, description='Probability of this transition occurring, if applicable')
    conditions: List[str] = Field(default_factory=list, description='List of conditions or legal rules that '
                                                                    'apply to this transition')

class Deadline(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    due_date: str

class LegalState(BaseModel):
    model_config = ConfigDict(extra="forbid")

    phase: Optional[str] = None
    legal_issue: Optional[str] = None
    status: Optional[str] = None
    actors_status: List[ActorStatus] = Field(default_factory=list, description='Status of each actor that '
                                                                               'is relevant for the legal state.')

class LegalNode(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(description='Unique identifier for the node')
    title: str = Field(description='Title or brief description of the legal state or event represented by this node')
    state: LegalState = Field(description='Structured representation of the '
                                                 'legal state at this node, can include relevant '
                                                 'facts, legal issues, etc.')
    deadlines: List[Deadline] = Field(default_factory=list)
    summary: str = Field(description='Narrative summary of the legal state or event at this node, '
                                     'for human-readable context')

    artifacts: List[Artifact] = Field(default_factory=list, description='List of artifacts associated '
                                                                        'with this legal state, ')

    incoming: List[str] = Field(default_factory=list, description='List of incoming edge IDs that lead to this node')
    outgoing: List[str] = Field(default_factory=list, description='List of outgoing edge IDs that '
                                                                  'lead to successor nodes')


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
        self.nodes: dict[str, LegalNode] = {}
        self.edges: dict[str, LegalEdge] = {}
        self.actors: dict[str, Actor] = {}

    # -------------------------
    # Actor
    # -------------------------
    def add_actor(self, name: str, role: str) -> Actor:
        actor = Actor(id=generate_id("actor"), name=name, role=role)
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
    def add_edge(
        self,
        source_id: str,
        target_id: str,
        action_type: str,
        actor_id: Optional[str] = None,
        probability: float = 1.0,
        conditions: Optional[list[str]] = None,
    ) -> LegalEdge:

        edge = LegalEdge(
            id=generate_id("edge"),
            source_id=source_id,
            target_id=target_id,
            action_type=action_type,
            actor_id=actor_id,
            probability=probability,
            conditions=conditions or [],
        )

        self.edges[edge.id] = edge

        # link nodes safely
        self.nodes[source_id].outgoing.append(edge.id)
        self.nodes[target_id].incoming.append(edge.id)

        return edge

    def add_branch_obj(self, source_id: str, branch_node: LegalBranchNode) -> LegalEdge:
        # Add the node
        self.nodes[branch_node.node.id] = branch_node.node

        # Add the edge
        edge = LegalEdge(
            id=generate_id("edge"),
            source_id=source_id,
            target_id=branch_node.node.id,
            action_type=branch_node.edge.action_type,
            actor_id=branch_node.edge.actor_id,
            probability=branch_node.edge.probability,
            conditions=branch_node.edge.conditions,
        )

        self.edges[edge.id] = edge

        # link nodes safely
        self.nodes[source_id].outgoing.append(edge.id)
        self.nodes[branch_node.node.id].incoming.append(edge.id)

        return edge

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

    # -------------------------
    # Serialization (Pydantic-native)
    # -------------------------
    def to_dict(self) -> dict:
        return {
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