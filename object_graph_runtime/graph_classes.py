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
    conditions: List[str]


class LegalNode(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    state: Dict[str, object]
    summary: str = ""

    artifacts: List[Artifact]

    incoming: List[str]
    outgoing: List[str]


class LegalBranchNode(BaseModel):
    model_config = ConfigDict(extra="forbid")

    edge: LegalEdge
    node: LegalNode


class LegalBranches(BaseModel):
    model_config = ConfigDict(extra="forbid")

    branches: list[LegalBranchNode]


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