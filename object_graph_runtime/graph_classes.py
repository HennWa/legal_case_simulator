from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional
import uuid
import json
from datetime import datetime

def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

@dataclass
class Actor:
    id: str
    name: str
    role: str  # claimant, defendant, court, etc.


@dataclass
class Artifact:
    id: str
    type: str  # email, letter, filing, invoice, etc.
    content: str
    created_by: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class LegalEdge:
    id: str
    source_id: str
    target_id: str

    action_type: str  # "send_reminder", "pay_invoice", "file_claim"
    actor_id: Optional[str] = None

    probability: float = 1.0
    conditions: List[str] = field(default_factory=list)


@dataclass
class LegalNode:
    id: str
    title: str
    state: Dict
    summary: str = ""

    artifacts: List[Artifact] = field(default_factory=list)

    incoming: List[str] = field(default_factory=list)
    outgoing: List[str] = field(default_factory=list)



class CaseGraph:
    def __init__(self):
        self.nodes: Dict[str, LegalNode] = {}
        self.edges: Dict[str, LegalEdge] = {}
        self.actors: Dict[str, Actor] = {}

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
    def add_node(self, title: str, state: Dict, summary: str = "") -> LegalNode:
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
        conditions: Optional[List[str]] = None,
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

        # link nodes
        self.nodes[source_id].outgoing.append(edge.id)
        self.nodes[target_id].incoming.append(edge.id)

        return edge

    # -------------------------
    # Traversal helpers
    # -------------------------
    def get_successors(self, node_id: str) -> List[LegalNode]:
        node = self.nodes[node_id]
        return [
            self.nodes[self.edges[eid].target_id]
            for eid in node.outgoing
        ]

    def get_predecessors(self, node_id: str) -> List[LegalNode]:
        node = self.nodes[node_id]
        return [
            self.nodes[self.edges[eid].source_id]
            for eid in node.incoming
        ]

    # -------------------------
    # Serialization
    # -------------------------
    def to_dict(self) -> Dict:
        return {
            "nodes": {nid: asdict(node) for nid, node in self.nodes.items()},
            "edges": {eid: asdict(edge) for eid, edge in self.edges.items()},
            "actors": {aid: asdict(actor) for aid, actor in self.actors.items()},
        }

    def to_json(self, path: str):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)



