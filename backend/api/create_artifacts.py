from fastapi import APIRouter
from pydantic import BaseModel, Field
from backend.object_graph_runtime.graph_classes import Artifact, generate_id, utc_now
from backend.expansion_engine.exapnsion_engine import ExpansionEngine
from backend.llm_interface.llm_interface import MockLLMProvider
from backend.database.repositories.graph_repository import GraphRepository
from backend.database.repositories.node_repository import NodeRepository
from backend.database.repositories.edge_repository import EdgeRepository
from backend.database.repositories.artifact_repository import ArtifactRepository
import os
from dotenv import load_dotenv

router = APIRouter()

load_dotenv(override=True)
openai_api_key = os.getenv('OPENAI_API_KEY')

class CreateArtifactPayload(BaseModel):
    case_id: str
    node_id: str

    title: str = Field(min_length=1)
    type: str = Field(min_length=1)

    original_filename: str
    extracted_content: str
    content: str


class CreateArtifactsRequest(BaseModel):
    case_id: str
    edge_id: str


@router.post("/create_artifact")
def create_artifact(payload: CreateArtifactPayload):

    repo = GraphRepository()
    art_repo = ArtifactRepository()
    node_repo = NodeRepository()

    artifact = Artifact(
        id=generate_id("art"),
        case_id=payload.case_id,
        type=payload.type,
        title=payload.title,
        source_type="uploaded",
        original_filename=payload.original_filename,
        original_file_url="",
        extracted_content=payload.extracted_content,
        output_files=[],
        content=payload.extracted_content,
        created_by=payload.content,
        timestamp_created=utc_now(),
        timestamp_uploaded=utc_now(),
    )

    graph = repo.load_graph(payload.case_id)
    node = graph.nodes[payload.node_id]
    node.state.artifact_ids.append(artifact.id)

    try:
        art_repo.create(artifact)
        node_repo.upsert(node)
    except Exception:
        art_repo.delete(artifact.id)
        raise

    return artifact


@router.post("/create_artifacts")
def create_artifacts(payload: CreateArtifactsRequest):
    repo = GraphRepository()
    art_repo = ArtifactRepository()
    node_repo = NodeRepository()
    edge_repo = EdgeRepository()
    graph = repo.load_graph(payload.case_id)

    llm = MockLLMProvider(key=openai_api_key)
    engine = ExpansionEngine(graph, llm)

    artifact_collection = engine.create_artifacts(payload.edge_id)

    node_repo.update(engine.graph.nodes[engine.graph.edges[payload.edge_id].target_id])
    edge_repo.update(engine.graph.edges[payload.edge_id])

    for art in artifact_collection.artifacts:
        art_repo.create(art)

    artifact_ids = [art.id for art in artifact_collection.artifacts]

    return artifact_ids


