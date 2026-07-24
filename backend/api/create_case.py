import os
from typing import List

from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel

from backend.database.repositories.graph_repository import GraphRepository
from backend.object_graph_runtime.graph_classes import (
    Actor,
    ActorStatus,
    Case,
    CaseGraph,
    LegalNode,
    LegalState,
    generate_id,
    utc_now,
)


router = APIRouter()

load_dotenv(override=True)

openai_api_key = os.getenv("OPENAI_API_KEY")


class ActorPayload(BaseModel):
    name: str
    role: str
    gender: str
    date_of_birth: str
    nationality: str
    profession: str
    background: str


class CreateCasePayload(BaseModel):
    owner_id: str
    title: str
    applied_law: str
    description: str
    legal_issue: str
    deadlines: str
    status_date: str
    legal_initiation_date: str
    language: str
    actors: List[ActorPayload]


class CreateCaseResponse(BaseModel):
    case: dict
    initial_node_id: str


@router.post(
    "/create_case",
    response_model=CreateCaseResponse,
)
def create_case(
    payload: CreateCasePayload,
) -> CreateCaseResponse:
    case_id = generate_id("case")

    actors = []

    for actor_payload in payload.actors:
        actor = Actor(
            id=generate_id("actor"),
            case_id=case_id,
            name=actor_payload.name,
            role=actor_payload.role,
        )

        actors.append(actor)

    actor_statuses = []

    for actor in actors:
        actor_status = ActorStatus(
            actor=actor,
            paid=0,
            received=0,
        )

        actor_statuses.append(actor_status)

    # Temporary implementation until structured deadline objects
    # are created from payload.deadlines.
    deadlines = []

    state = LegalState(
        start_time=payload.status_date,
        end_time=payload.legal_initiation_date,
        legal_issue=payload.legal_issue,
        description=payload.description,
        final_state=False,
        actors_status=actor_statuses,
        legal_references=[],
        artifact_ids=[],
        deadlines=deadlines,
    )

    graph = CaseGraph()

    graph.actors = {
        actor.name: actor
        for actor in actors
    }

    graph.case = Case(
        id=case_id,
        owner_id=payload.owner_id,
        title=payload.title,
        created_at=utc_now(),
    )

    initial_node = LegalNode(
        id=generate_id("node"),
        case_id=graph.case.id,
        incoming=[],
        outgoing=[],
        title=payload.title,
        state=state,
        summary=payload.description,
    )

    graph.add_node_obj(initial_node)

    repository = GraphRepository()

    print("Saving graph to MongoDB")

    repository.save_graph(graph)

    print("Graph saved to MongoDB")

    return CreateCaseResponse(
        case=graph.case.model_dump(mode="json"),
        initial_node_id=initial_node.id,
    )