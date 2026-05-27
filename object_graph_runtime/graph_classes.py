from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, List
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

    id: str
    name: str
    role: str  # claimant, defendant, court, etc.


class Artifact(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    type: str  # email, letter, filing, invoice, etc.
    content: str
    created_by: Optional[str] = None
    timestamp: str = Field(default_factory=utc_now)


class LegalEdge(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    source_id: str
    target_id: str

    action_type: str
    actor_id: Optional[str] = None

    probability: float = 1.0
    conditions: List[str] = Field(default_factory=list)


class LegalNode(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    state: Dict[str, object]
    summary: str = ""

    artifacts: List[Artifact] = Field(default_factory=list)

    incoming: List[str] = Field(default_factory=list)
    outgoing: List[str] = Field(default_factory=list)


class LegalBranchNode(BaseModel):
    model_config = ConfigDict(extra="forbid")

    edge: LegalEdge
    node: LegalNode


class LegalBranches(BaseModel):
    model_config = ConfigDict(extra="forbid")

    branches: list[LegalBranchNode]


class PathStep(BaseModel):
    node_id: str
    event_type: Optional[str]  # edge action that led here
    actor_id: Optional[str]
    state_snapshot: Dict
    summary: str


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
    def add_node(self, title: str, state: dict[str, object], summary: str = "") -> LegalNode:
        node = LegalNode(
            id=generate_id("node"),
            title=title,
            state=state,
            summary=summary,
        )
        self.nodes[node.id] = node
        return node

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