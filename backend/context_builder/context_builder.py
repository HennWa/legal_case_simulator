from __future__ import annotations

from typing import Any

from backend.object_graph_runtime.graph_classes import CaseGraph


DEFAULT_MAX_HISTORY_STEPS = 8


def build_simulation_context(
    graph: CaseGraph,
    node_id: str,
    max_history_steps: int = DEFAULT_MAX_HISTORY_STEPS,
) -> dict[str, Any]:
    """Build compact context for the latency-critical node simulation call.

    The context deliberately keeps the current state complete while compressing
    older history to transition-level information. This avoids repeatedly
    sending complete historical LegalState snapshots, legal references,
    deadlines, actor states, and other data that should already be represented
    in the current state.

    Args:
        graph: Case graph containing the node to expand.
        node_id: ID of the current node.
        max_history_steps: Maximum number of historical path steps to include.
            The current node is never counted as a historical step.

    Returns:
        JSON-serializable dictionary containing the information needed by the
        transition simulator.
    """

    if max_history_steps < 0:
        raise ValueError("max_history_steps must be >= 0")

    node = graph.get_node(node_id)
    path = graph.build_path(node_id)

    # The current state is included separately and in full. Therefore only
    # predecessor path steps belong in the compact history.
    historical_path = path[:-1]

    if max_history_steps == 0:
        historical_path = []
    else:
        historical_path = historical_path[-max_history_steps:]

    history = [
        _build_history_step(graph, step.node_id)
        for step in historical_path
    ]

    outgoing_edges = graph.get_outgoing_edges(node_id)

    return {
        "case": {
            "id": graph.case.id,
            "title": graph.case.title,
            "language": _enum_value(graph.case.language),
            "applied_law": _enum_value(graph.case.applied_law),
        },
        "actors": [
            {
                "id": actor.id,
                "name": actor.name,
                "role": actor.role,
                "goal": actor.goal,
            }
            for actor in graph.actors.values()
        ],
        "history": history,
        "current_node": {
            "id": node.id,
            "title": node.title,
        },
        "current_state": node.state.model_dump(mode="json"),
        "existing_outgoing_branches": [
            {
                "action_type": edge.action_type,
                "actor_id": edge.actor_id,
                "probability": edge.probability,
            }
            for edge in outgoing_edges
        ],
    }


def _build_history_step(
    graph: CaseGraph,
    node_id: str,
) -> dict[str, Any]:
    """Create a compact representation of one historical path step."""

    node = graph.get_node(node_id)
    incoming_edges = graph.get_incoming_edges(node_id)

    if len(incoming_edges) > 1:
        raise ValueError(
            f"Node '{node_id}' has {len(incoming_edges)} incoming edges. "
            "Simulation context currently requires a unique causal predecessor."
        )

    edge = incoming_edges[0] if incoming_edges else None

    if edge is None:
        return {
            "node_id": node.id,
            "action_type": None,
            "actor_id": None,
            "start_time": node.state.start_time,
            "end_time": node.state.end_time,
            "outcome": node.summary,
            "initial_state": True,
        }

    return {
        "node_id": node.id,
        "action_type": edge.action_type,
        "actor_id": edge.actor_id,
        "start_time": edge.start_time,
        "end_time": edge.end_time,
        "outcome": node.summary,
        "initial_state": False,
    }


def _enum_value(value: Any) -> Any:
    """Return an Enum's raw value while leaving ordinary values unchanged."""

    return getattr(value, "value", value)
