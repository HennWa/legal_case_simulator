from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.database.repositories.graph_repository import GraphRepository


router = APIRouter()


class NodeRequest(BaseModel):
    case_id: str
    node_id: str


@router.post("/sidebar_stats")
def sidebar_stats(payload: NodeRequest):
    """
    Return all information required by the graph sidebar for the selected node.

    The existing path information contains:
    - financial_info
    - state_periods

    This endpoint additionally exposes the negotiation profile of every actor
    at the selected node. Actors for which a negotiation profile is not
    applicable are still returned with ``negotiation_profile=None`` so that
    the frontend can show a clear "Not applicable" state.
    """
    repo = GraphRepository()
    graph = repo.load_graph(payload.case_id)

    try:
        selected_node = graph.get_node(payload.node_id)
    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail=f"Node '{payload.node_id}' was not found.",
        ) from exc

    path_info = graph.get_path_info(payload.node_id)

    actor_negotiation_profiles = []

    for actor_status in selected_node.state.actors_status:
        actor = actor_status.actor
        profile = actor_status.negotiation_profile

        actor_negotiation_profiles.append(
            {
                "actor_id": actor.id,
                "actor_name": actor.name,
                "actor_role": actor.role,
                "goal": actor.goal,
                "intermediate_goal": actor_status.intermediate_goal,
                "negotiation_profile": (
                    profile.model_dump(mode="json")
                    if profile is not None
                    else None
                ),
            }
        )

    return {
        **path_info,
        "actor_negotiation_profiles": actor_negotiation_profiles,
    }


