from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from backend.database.repositories.graph_repository import GraphRepository
from backend.object_graph_runtime.graph_classes import (CaseGraph, LegalState, Actor,
                                                        ActorStatus, LegalNode, Case, utc_now, generate_id)
import os
from dotenv import load_dotenv

router = APIRouter()

load_dotenv(override=True)
openai_api_key = os.getenv('OPENAI_API_KEY')


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


@router.post("/create_case")
def create_case(payload: CreateCasePayload):

    case_id = generate_id('case')

    actors = []
    for actor_payload in payload.actors:
        actor = Actor(
            id=generate_id('actor'),
            case_id=case_id,
            name=actor_payload.name,
            role=actor_payload.role
        )
        actors.append(actor)

    actor_stati =[]
    for actor in actors:
        status = ActorStatus(
            actor=actor,
            paid=0,
            received=0
        )
        actor_stati.append(status)

    deadlines = [] # temporary

    state = LegalState(
        start_time=payload.status_date,
        end_time=payload.legal_initiation_date,
        legal_issue=payload.legal_issue,
        description=payload.description,
        final_state=False,
        actors_status=actor_stati,
        legal_references=[],
        artifacts=[],
        deadlines=deadlines
    )

    graph = CaseGraph()

    graph.actors = {actor.name : actor for actor in actors}
    graph.case = Case(
        id=case_id,
        owner_id=payload.owner_id,
        title=payload.title,
        created_at=utc_now()
    )

    init_node = LegalNode(
        id=generate_id('node'),
        case_id=graph.case.id,
        incoming=[],
        outgoing=[],
        title=payload.title,
        state=state,
        summary='' + payload.description,
    )

    _ = graph.add_node_obj(init_node)

    repo = GraphRepository()
    print('save graph to mongo db')
    repo.save_graph(graph)
    print('graph saved to mongo db')

    return graph.case.model_dump(mode="json")