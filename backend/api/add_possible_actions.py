import os

from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    Depends,
)
from pydantic import BaseModel

from backend.auth.authorization import (
    require_case_access,
)
from backend.auth.dependencies import (
    get_current_user,
)
from backend.auth.models import User
from backend.database.repositories.graph_repository import (
    GraphRepository,
)
from backend.expansion_engine.exapnsion_engine import (
    ExpansionEngine,
)
from backend.llm_interface.llm_interface import (
    MockLLMProvider,
)


router = APIRouter()

load_dotenv(
    override=True
)

openai_api_key = os.getenv(
    "OPENAI_API_KEY"
)


class AddPossibleActionsRequest(
    BaseModel
):
    case_id: str
    node_id: str


@router.post(
    "/add_possible_actions"
)
def add_possible_actions(
    payload: AddPossibleActionsRequest,
    current_user: User = Depends(
        get_current_user
    ),
):
    require_case_access(
        payload.case_id,
        current_user,
    )

    repository = GraphRepository()

    graph = repository.load_graph(
        payload.case_id
    )

    llm = MockLLMProvider(
        key=openai_api_key
    )

    engine = ExpansionEngine(
        graph,
        llm,
    )

    node = (
        engine.add_possible_actions(
            payload.node_id
        )
    )

    repository.save_graph(
        graph
    )

    return node.model_dump()