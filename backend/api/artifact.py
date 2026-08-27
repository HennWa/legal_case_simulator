from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from pydantic import BaseModel

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


router = APIRouter()


class ArtifactIdsRequest(BaseModel):
    artifact_ids: list[str]


class UpdateArtifactRequest(BaseModel):
    content: str


@router.get(
    "/artifacts/{artifact_id}"
)
def get_artifact(
    artifact_id: str,
    current_user: User = Depends(
        get_current_user
    ),
):
    repository = ArtifactRepository()

    artifact = repository.get(
        artifact_id
    )

    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Artifact '{artifact_id}' "
                "not found"
            ),
        )

    require_case_access(
        artifact.case_id,
        current_user,
    )

    return artifact.model_dump()


@router.post(
    "/artifacts/batch"
)
def get_artifacts(
    payload: ArtifactIdsRequest,
    current_user: User = Depends(
        get_current_user
    ),
):
    repository = ArtifactRepository()

    artifacts = repository.get_many(
        payload.artifact_ids
    )

    for artifact in artifacts:
        require_case_access(
            artifact.case_id,
            current_user,
        )

    return [
        artifact.model_dump()
        for artifact in artifacts
    ]


@router.get(
    "/cases/{case_id}/artifacts"
)
def get_artifacts_by_case(
    case_id: str,
    current_user: User = Depends(
        get_current_user
    ),
):
    require_case_access(
        case_id,
        current_user,
    )

    repository = ArtifactRepository()

    artifacts = repository.get_by_case(
        case_id
    )

    return [
        artifact.model_dump()
        for artifact in artifacts
    ]


@router.patch(
    "/update_artifact/{artifact_id}"
)
def update_artifact(
    artifact_id: str,
    payload: UpdateArtifactRequest,
    current_user: User = Depends(
        get_current_user
    ),
):
    repository = ArtifactRepository()

    artifact = repository.get(
        artifact_id
    )

    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Artifact '{artifact_id}' "
                "not found"
            ),
        )

    require_case_access(
        artifact.case_id,
        current_user,
    )

    artifact.content = (
        payload.content
    )

    repository.upsert(
        artifact
    )

    return artifact.model_dump()