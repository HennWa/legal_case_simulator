from __future__ import annotations

from typing import Any

from backend.object_graph_runtime.graph_classes import CaseGraph


DEFAULT_MAX_LEGAL_HISTORY_STEPS = 6


def build_legal_analysis_context(
    graph: CaseGraph,
    node_id: str,
    max_history_steps: int = DEFAULT_MAX_LEGAL_HISTORY_STEPS,
) -> dict[str, Any]:
    """
    Build compact context for the legal-analysis / legal-check stage.

    The context is optimized for legal reasoning rather than simulation.

    It focuses on:

    - jurisdiction and case metadata
    - actor identities and roles
    - compact recent procedural history
    - predecessor facts
    - incoming action
    - current facts
    - deterministic fact changes
    - current legal issue
    - already established legal references
    - already established deadlines

    Full historical LegalState snapshots, branch probabilities,
    negotiation profiles, and unrelated simulation information are
    deliberately excluded.
    """

    if max_history_steps < 0:
        raise ValueError(
            "max_history_steps must be >= 0"
        )

    node = graph.get_node(node_id)

    incoming_edges = graph.get_incoming_edges(
        node_id
    )

    if len(incoming_edges) > 1:
        raise ValueError(
            f"Node '{node_id}' has "
            f"{len(incoming_edges)} incoming edges. "
            "Legal analysis currently requires "
            "a unique causal predecessor."
        )

    incoming_edge = (
        incoming_edges[0]
        if incoming_edges
        else None
    )

    previous_node = None

    if incoming_edge is not None:
        previous_node = graph.get_node(
            incoming_edge.source_id
        )

    previous_facts = _facts_to_dict(
        previous_node.state.facts
        if previous_node is not None
        else []
    )

    current_facts = _facts_to_dict(
        node.state.facts
    )

    fact_changes = _build_fact_changes(
        previous_facts=previous_facts,
        current_facts=current_facts,
    )

    history = _build_legal_history(
        graph=graph,
        node_id=node_id,
        max_history_steps=max_history_steps,
    )

    return {
        "case": {
            "id": graph.case.id,
            "title": graph.case.title,
            "language": _enum_value(
                graph.case.language
            ),
            "applied_law": _enum_value(
                graph.case.applied_law
            ),
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

        "previous_state": (
            _build_previous_state_context(
                previous_node
            )
            if previous_node is not None
            else None
        ),

        "incoming_action": (
            _build_incoming_action_context(
                incoming_edge
            )
            if incoming_edge is not None
            else None
        ),

        "current_node": {
            "id": node.id,
            "title": node.title,
            "summary": node.summary,
        },

        "current_state": {
            "start_time": (
                node.state.start_time
            ),
            "end_time": (
                node.state.end_time
            ),
            "description": (
                node.state.description
            ),
            "facts": current_facts,
            "legal_issue": (
                node.state.legal_issue
            ),
            "final_state": (
                node.state.final_state
            ),
            "deadlines": [
                deadline.model_dump(
                    mode="json"
                )
                for deadline
                in node.state.deadlines
            ],
            "legal_references": [
                reference.model_dump(
                    mode="json"
                )
                for reference
                in node.state.legal_references
            ],
        },

        "fact_changes": fact_changes,
    }


def build_initial_legal_analysis_context(
    graph: CaseGraph,
    node_id: str,
) -> dict[str, Any]:
    """
    Build legal-analysis context for a root node.

    Root nodes have no predecessor and no incoming action.
    """

    node = graph.get_node(node_id)

    if node.incoming:
        raise ValueError(
            f"Node '{node_id}' is not an initial node."
        )

    return {
        "case": {
            "id": graph.case.id,
            "title": graph.case.title,
            "language": _enum_value(
                graph.case.language
            ),
            "applied_law": _enum_value(
                graph.case.applied_law
            ),
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

        "current_node": {
            "id": node.id,
            "title": node.title,
            "summary": node.summary,
        },

        "current_state": {
            "start_time": (
                node.state.start_time
            ),
            "end_time": (
                node.state.end_time
            ),
            "description": (
                node.state.description
            ),
            "facts": _facts_to_dict(
                node.state.facts
            ),
            "legal_issue": (
                node.state.legal_issue
            ),
            "final_state": (
                node.state.final_state
            ),
            "deadlines": [
                deadline.model_dump(
                    mode="json"
                )
                for deadline
                in node.state.deadlines
            ],
            "legal_references": [
                reference.model_dump(
                    mode="json"
                )
                for reference
                in node.state.legal_references
            ],
        },
    }


def _build_previous_state_context(
    previous_node,
) -> dict[str, Any]:
    """
    Return the legally relevant portion of the predecessor state.
    """

    return {
        "node_id": (
            previous_node.id
        ),
        "title": (
            previous_node.title
        ),
        "summary": (
            previous_node.summary
        ),
        "start_time": (
            previous_node.state.start_time
        ),
        "end_time": (
            previous_node.state.end_time
        ),
        "facts": _facts_to_dict(
            previous_node.state.facts
        ),
        "legal_issue": (
            previous_node.state.legal_issue
        ),
        "deadlines": [
            deadline.model_dump(
                mode="json"
            )
            for deadline
            in previous_node.state.deadlines
        ],
        "legal_references": [
            reference.model_dump(
                mode="json"
            )
            for reference
            in previous_node.state.legal_references
        ],
    }


def _build_incoming_action_context(
    edge,
) -> dict[str, Any]:
    """
    Return legally relevant information about the action being checked.

    Probability is intentionally excluded because it belongs to the
    simulation layer rather than legal analysis.
    """

    return {
        "id": edge.id,
        "source_id": edge.source_id,
        "target_id": edge.target_id,
        "start_time": edge.start_time,
        "end_time": edge.end_time,
        "action_type": (
            edge.action_type
        ),
        "actor_id": (
            edge.actor_id
        ),
        "conditions": list(
            edge.conditions
        ),
        "lawyer_involved": (
            edge.lawyer_involved
        ),
        "legal_references": [
            reference.model_dump(
                mode="json"
            )
            for reference
            in edge.legal_references
        ],
    }


def _build_legal_history(
    graph: CaseGraph,
    node_id: str,
    max_history_steps: int,
) -> list[dict[str, Any]]:
    """
    Build compact history before the action currently analyzed.

    The current node is excluded because its incoming action and resulting
    state are supplied explicitly elsewhere in the context.
    """

    if max_history_steps == 0:
        return []

    path = graph.build_path(
        node_id
    )

    historical_path = path[:-1]

    historical_path = (
        historical_path[
            -max_history_steps:
        ]
    )

    history = []

    for step in historical_path:
        historical_node = (
            graph.get_node(
                step.node_id
            )
        )

        incoming_edges = (
            graph.get_incoming_edges(
                historical_node.id
            )
        )

        if len(incoming_edges) > 1:
            raise ValueError(
                f"Node '{historical_node.id}' has "
                f"{len(incoming_edges)} incoming edges. "
                "Legal history currently requires "
                "a unique causal predecessor."
            )

        edge = (
            incoming_edges[0]
            if incoming_edges
            else None
        )

        history.append(
            {
                "node_id": (
                    historical_node.id
                ),
                "action_type": (
                    edge.action_type
                    if edge is not None
                    else None
                ),
                "actor_id": (
                    edge.actor_id
                    if edge is not None
                    else None
                ),
                "start_time": (
                    edge.start_time
                    if edge is not None
                    else historical_node
                    .state.start_time
                ),
                "end_time": (
                    edge.end_time
                    if edge is not None
                    else historical_node
                    .state.end_time
                ),
                "outcome": (
                    historical_node.summary
                ),
                "initial_state": (
                    edge is None
                ),
            }
        )

    return history


def _facts_to_dict(
    facts,
) -> list[dict[str, str]]:
    """
    Convert CaseFact objects into compact dictionaries.
    """

    return [
        {
            "id": fact.id,
            "description": (
                fact.description
            ),
        }
        for fact in facts
    ]


def _build_fact_changes(
    previous_facts: list[dict[str, str]],
    current_facts: list[dict[str, str]],
) -> dict[str, list[dict[str, Any]]]:
    """
    Compare predecessor and current facts deterministically.

    Stable CaseFact IDs are the primary identity mechanism.

    Categories:

    persisting:
        Same ID and same factual proposition.

    modified:
        Same ID but changed description.

    new:
        Fact exists only in current state.

    removed:
        Fact exists only in predecessor state.
    """

    previous_by_id = {
        fact["id"]: fact
        for fact in previous_facts
    }

    current_by_id = {
        fact["id"]: fact
        for fact in current_facts
    }

    persisting = []
    modified = []
    new = []
    removed = []

    for fact_id, current_fact in (
        current_by_id.items()
    ):
        previous_fact = (
            previous_by_id.get(
                fact_id
            )
        )

        if previous_fact is None:
            new.append(
                current_fact
            )
            continue

        if (
            previous_fact["description"]
            == current_fact["description"]
        ):
            persisting.append(
                current_fact
            )

        else:
            modified.append(
                {
                    "id": fact_id,
                    "previous_description": (
                        previous_fact[
                            "description"
                        ]
                    ),
                    "current_description": (
                        current_fact[
                            "description"
                        ]
                    ),
                }
            )

    for fact_id, previous_fact in (
        previous_by_id.items()
    ):
        if fact_id not in current_by_id:
            removed.append(
                previous_fact
            )

    return {
        "persisting": persisting,
        "modified": modified,
        "new": new,
        "removed": removed,
    }


def _enum_value(
    value: Any,
) -> Any:
    """
    Return an Enum's raw value while leaving ordinary values unchanged.
    """

    return getattr(
        value,
        "value",
        value,
    )