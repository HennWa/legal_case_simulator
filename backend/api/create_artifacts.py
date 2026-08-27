import os

from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    Depends,
)
from pydantic import (
    BaseModel,
    Field,
)

from backend.auth.authorization import (
    require_case_access,
)
from backend.auth.dependencies import (
    get_current_user,
)
from backend.auth.models import User
from backend.database.repositories.artifact_repository import (
    ArtifactRepository,
)
from backend.database.repositories.edge_repository import (
    EdgeRepository,
)
from backend.database.repositories.graph_repository import (
    GraphRepository,
)
from backend.database.repositories.node_repository import (
    NodeRepository,
)
from backend.expansion_engine.exapnsion_engine import (
    ExpansionEngine,
)
from backend.llm_interface.llm_interface import (
    MockLLMProvider,
)
from backend.object_graph_runtime.graph_classes import (
    Artifact,
    generate_id,
    utc_now,
)


router = APIRouter()


load_dotenv(
    override=True
)

openai_api_key = os.getenv(
    "OPENAI_API_KEY"
)


class CreateArtifactPayload(
    BaseModel
):
    case_id: str
    node_id: str

    title: str = Field(
        min_length=1
    )

    type: str = Field(
        min_length=1
    )

    original_filename: str
    extracted_content: str
    content: str


class CreateArtifactsRequest(
    BaseModel
):
    case_id: str
    edge_id: str


@router.post(
    "/create_artifact"
)
def create_artifact(
    payload: CreateArtifactPayload,
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Create an artifact and attach it
    to an existing case node.

    Case ownership and artifact creator
    are derived from the authenticated
    Casendra user.
    """

    require_case_access(
        payload.case_id,
        current_user,
    )

    graph_repository = (
        GraphRepository()
    )

    artifact_repository = (
        ArtifactRepository()
    )

    node_repository = (
        NodeRepository()
    )

    graph = (
        graph_repository.load_graph(
            payload.case_id
        )
    )

    node = graph.nodes.get(
        payload.node_id
    )

    if node is None:
        from fastapi import (
            HTTPException,
            status,
        )

        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                f"Node '{payload.node_id}' "
                "was not found in this case."
            ),
        )

    artifact = Artifact(
        id=generate_id(
            "art"
        ),
        case_id=payload.case_id,
        type=payload.type,
        title=payload.title,
        source_type="uploaded",
        original_filename=(
            payload.original_filename
        ),
        original_file_url="",
        extracted_content=(
            payload.extracted_content
        ),
        output_files=[],
        content=payload.content,
        created_by=current_user.id,
        timestamp_created=utc_now(),
        timestamp_uploaded=utc_now(),
    )

    node.state.artifact_ids.append(
        artifact.id
    )

    try:
        artifact_repository.create(
            artifact
        )

        node_repository.upsert(
            node
        )

    except Exception:
        artifact_repository.delete(
            artifact.id
        )

        raise

    return artifact.model_dump()


@router.post(
    "/create_artifacts"
)
def create_artifacts(
    payload: CreateArtifactsRequest,
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Generate artifacts for an existing graph edge.

    The authenticated user must own the case before
    any graph data is loaded or modified.
    """

    require_case_access(
        payload.case_id,
        current_user,
    )

    graph_repository = (
        GraphRepository()
    )

    artifact_repository = (
        ArtifactRepository()
    )

    node_repository = (
        NodeRepository()
    )

    edge_repository = (
        EdgeRepository()
    )

    graph = (
        graph_repository.load_graph(
            payload.case_id
        )
    )

    llm = MockLLMProvider(
        key=openai_api_key
    )

    engine = ExpansionEngine(
        graph,
        llm,
    )

    artifact_collection = (
        engine.create_artifacts(
            payload.edge_id
        )
    )

    edge = engine.graph.edges[
        payload.edge_id
    ]

    target_node = (
        engine.graph.nodes[
            edge.target_id
        ]
    )

    node_repository.update(
        target_node
    )

    edge_repository.update(
        edge
    )

    for artifact in (
        artifact_collection.artifacts
    ):
        artifact_repository.create(
            artifact
        )

    artifact_ids = [
        artifact.id
        for artifact
        in artifact_collection.artifacts
    ]

    return artifact_ids