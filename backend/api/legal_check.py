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
from backend.legal_services.legal_services import (
    LegalServices,
)
from backend.llm_interface.llm_interface import (
    LegalLLMProvider,
)


router = APIRouter()

load_dotenv(
    override=True
)

openai_api_key = os.getenv(
    "OPENAI_API_KEY"
)


class LegalCheckRequest(BaseModel):
    case_id: str
    node_id: str


@router.post("/legal_check")
def legal_check(
    payload: LegalCheckRequest,
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

    llm = LegalLLMProvider(
        key=openai_api_key,
        model="gpt-5",
        search_context_size="high",
    )

    legal_services = LegalServices(
        graph,
        llm,
    )

    legal_services.legal_check(
        payload.node_id
    )

    repository.save_graph(
        graph
    )

    return {
        "success": True
    }