from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)

from backend.auth.authorization import (
    require_case_access,
)
from backend.auth.dependencies import (
    get_current_user,
)
from backend.auth.models import User
from backend.database.repositories.node_repository import (
    NodeRepository,
)
from backend.document_parsers.parser_exceptions import (
    DocumentParsingError,
    InvalidDocumentError,
    UnsupportedDocumentTypeError,
)
from backend.services.document_service import (
    DocumentService,
)


router = APIRouter()


@router.post(
    "/upload_document",
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    case_id: str = Form(...),
    node_id: str = Form(...),
    file: UploadFile = File(...),
    title: str | None = Form(
        default=None
    ),
    type: str = Form(
        default="document"
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Upload, detect and parse a document,
    then create an artifact attached to
    the requested node.

    The authenticated Casendra user must
    own the requested case.

    The artifact creator is derived from
    the authenticated user and must not
    be supplied by the client.
    """

    require_case_access(
        case_id,
        current_user,
    )

    node_repository = (
        NodeRepository()
    )

    document_service = (
        DocumentService()
    )

    node = node_repository.get(
        node_id
    )

    if node is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                f"Node '{node_id}' "
                "was not found."
            ),
        )

    if node.case_id != case_id:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                f"Node '{node_id}' does not "
                f"belong to case '{case_id}'."
            ),
        )

    try:
        file_bytes = await file.read()

        artifact = (
            document_service
            .create_artifact_from_upload(
                case_id=case_id,
                node_id=node_id,
                file_bytes=file_bytes,
                original_filename=(
                    file.filename
                    or "unnamed-document"
                ),
                declared_content_type=(
                    file.content_type
                ),
                title=title,
                artifact_type=type,
                created_by=current_user.id,
            )
        )

        if (
            artifact.id
            not in node.state.artifact_ids
        ):
            node.state.artifact_ids.append(
                artifact.id
            )

            node_repository.update(
                node
            )

        return artifact.model_dump()

    except (
        UnsupportedDocumentTypeError
    ) as exc:
        raise HTTPException(
            status_code=(
                status
                .HTTP_415_UNSUPPORTED_MEDIA_TYPE
            ),
            detail=str(exc),
        ) from exc

    except InvalidDocumentError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(exc),
        ) from exc

    except DocumentParsingError as exc:
        raise HTTPException(
            status_code=(
                status
                .HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(exc),
        ) from exc

    finally:
        await file.close()