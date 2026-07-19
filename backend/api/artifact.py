from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.database.repositories.artifact_repository import (
    ArtifactRepository,
)

router = APIRouter()


class ArtifactIdsRequest(BaseModel):
    artifact_ids: list[str]


@router.get("/artifacts/{artifact_id}")
def get_artifact(artifact_id: str):
    repository = ArtifactRepository()
    artifact = repository.get(artifact_id)

    if artifact is None:
        raise HTTPException(
            status_code=404,
            detail=f"Artifact '{artifact_id}' not found",
        )

    return artifact.model_dump()


@router.post("/artifacts/batch")
def get_artifacts(payload: ArtifactIdsRequest):
    repository = ArtifactRepository()

    artifacts = repository.get_many(payload.artifact_ids)

    return [
        artifact.model_dump()
        for artifact in artifacts
    ]