from typing import List

from fastapi import (
    APIRouter,
    Depends,
)
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from backend.auth.dependencies import (
    get_current_user,
)
from backend.auth.models import User
from backend.database.repositories.graph_repository import (
    GraphRepository,
)
from backend.object_graph_runtime.graph_classes import (
    Actor,
    ActorStatus,
    AppliedLaw,
    Case,
    CaseGraph,
    Language,
    LegalNode,
    LegalState,
    NegotiationProfile,
    generate_id,
    utc_now,
)
from backend.services.usage_service import (
    UsageService,
)


router = APIRouter()


class NegotiationProfilePayload(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid",
    )

    cooperativeness: int = Field(
        ge=0,
        le=100,
    )

    assertiveness: int = Field(
        ge=0,
        le=100,
    )

    trust_in_opponent: int = Field(
        ge=0,
        le=100,
    )

    flexibility: int = Field(
        ge=0,
        le=100,
    )

    emotionality: int = Field(
        ge=0,
        le=100,
    )


class ActorPayload(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    name: str
    role: str
    goal: str

    gender: str | None = None
    date_of_birth: str | None = None
    nationality: str | None = None
    profession: str | None = None
    background: str | None = None

    has_legal_expenses_insurance: (
        bool | None
    ) = False

    negotiation_profile: (
        NegotiationProfilePayload
        | None
    ) = None


class CreateCasePayload(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid",
    )

    title: str
    applied_law: str
    description: str
    legal_issue: str
    deadlines: str
    status_date: str
    legal_initiation_date: str
    language: str
    actors: List[ActorPayload]


class CreateCaseResponse(
    BaseModel
):
    case: dict
    initial_node_id: str


def clean_optional_string(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    stripped_value = (
        value.strip()
    )

    if not stripped_value:
        return None

    return stripped_value


def build_negotiation_profile(
    payload: (
        NegotiationProfilePayload
        | None
    ),
) -> NegotiationProfile | None:
    if payload is None:
        return None

    return NegotiationProfile(
        cooperativeness=(
            payload.cooperativeness
        ),
        assertiveness=(
            payload.assertiveness
        ),
        trust_in_opponent=(
            payload.trust_in_opponent
        ),
        flexibility=(
            payload.flexibility
        ),
        emotionality=(
            payload.emotionality
        ),

        # Satisfaction represents the current
        # state, not a permanent actor
        # characteristic.
        #
        # The initial value is zero because no
        # goal has yet been achieved at case
        # creation.
        current_goal_satisfaction=0,
    )


@router.post(
    "/create_case",
    response_model=(
        CreateCaseResponse
    ),
)
def create_case(
    payload: CreateCasePayload,
    current_user: User = Depends(
        get_current_user
    ),
) -> CreateCaseResponse:
    usage_service = (
        UsageService()
    )

    usage_service.reserve_node_creation(
        current_user
    )

    try:
        case_id = generate_id(
            "case"
        )

        actors: list[Actor] = []
        actor_statuses: list[
            ActorStatus
        ] = []

        for actor_payload in (
            payload.actors
        ):
            actor = Actor(
                id=generate_id(
                    "actor"
                ),
                case_id=case_id,
                name=(
                    actor_payload
                    .name
                    .strip()
                ),
                role=(
                    actor_payload
                    .role
                    .strip()
                ),
                goal=(
                    actor_payload
                    .goal
                    .strip()
                ),
                gender=(
                    clean_optional_string(
                        actor_payload
                        .gender,
                    )
                ),
                nationality=(
                    clean_optional_string(
                        actor_payload
                        .nationality,
                    )
                ),
                profession=(
                    clean_optional_string(
                        actor_payload
                        .profession,
                    )
                ),
                background=(
                    clean_optional_string(
                        actor_payload
                        .background,
                    )
                ),
                date_of_birth=(
                    clean_optional_string(
                        actor_payload
                        .date_of_birth,
                    )
                ),
                has_legal_expenses_insurance=(
                    actor_payload
                    .has_legal_expenses_insurance
                ),
            )

            actors.append(
                actor
            )

            negotiation_profile = (
                build_negotiation_profile(
                    actor_payload
                    .negotiation_profile,
                )
            )

            actor_status = (
                ActorStatus(
                    actor=actor,
                    income=[],
                    expenses=[],
                    negotiation_profile=(
                        negotiation_profile
                    ),
                    intermediate_goal=(
                        actor.goal
                    ),
                )
            )

            actor_statuses.append(
                actor_status
            )

        deadlines = []

        state = LegalState(
            start_time=(
                payload.status_date
                or utc_now()
            ),
            end_time=(
                payload
                .legal_initiation_date
                or payload.status_date
                or utc_now()
            ),
            legal_issue=(
                payload
                .legal_issue
                .strip()
            ),
            description=(
                payload
                .description
                .strip()
            ),
            final_state=False,
            actors_status=(
                actor_statuses
            ),
            legal_references=[],
            artifact_ids=[],
            deadlines=deadlines,
            potential_next_states=[],
        )

        graph = CaseGraph()

        graph.case = Case(
            id=case_id,
            owner_id=(
                current_user.id
            ),
            title=(
                payload
                .title
                .strip()
            ),
            created_at=utc_now(),
            language=Language(
                payload.language
            ),
            applied_law=(
                AppliedLaw(
                    payload.applied_law,
                )
            ),
            node_counter=1,
        )

        graph.actors = {
            actor.id: actor
            for actor in actors
        }

        initial_node = LegalNode(
            id=generate_id(
                "node"
            ),
            case_id=case_id,
            incoming=[],
            outgoing=[],
            number="1",
            title=(
                payload
                .title
                .strip()
            ),
            state=state,
            summary=(
                payload
                .description
                .strip()
            ),
        )

        graph.add_node_obj(
            initial_node
        )

        repository = (
            GraphRepository()
        )

        repository.save_graph(
            graph
        )

    except Exception:
        usage_service.release_node_creation(
            current_user.id
        )

        raise

    return CreateCaseResponse(
        case=(
            graph.case.model_dump(
                mode="json",
            )
        ),
        initial_node_id=(
            initial_node.id
        ),
    )