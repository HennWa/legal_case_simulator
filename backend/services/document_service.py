from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4
from zipfile import BadZipFile, ZipFile

from backend.database.repositories.artifact_repository import (
    ArtifactRepository,
)
from backend.document_parsers import (
    parse_docx,
    parse_html,
    parse_json,
    parse_pdf,
    parse_plain_text,
    parse_xml,
)
from backend.document_parsers.parser_exceptions import (
    InvalidDocumentError,
    UnsupportedDocumentTypeError,
)
from backend.object_graph_runtime.graph_classes import Artifact


MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024


@dataclass(frozen=True)
class DetectedDocumentType:
    format: str
    mime_type: str
    extension: str


class DocumentService:

    def __init__(
        self,
        artifact_repository: ArtifactRepository | None = None,
    ):
        self.artifact_repository = (
            artifact_repository
            or ArtifactRepository()
        )

    def create_artifact_from_upload(
        self,
        *,
        case_id: str,
        node_id: str,
        file_bytes: bytes,
        original_filename: str,
        declared_content_type: str | None,
        title: str | None = None,
        artifact_type: str = "document",
        created_by: str | None = None,
    ) -> Artifact:
        self._validate_upload(
            file_bytes=file_bytes,
            original_filename=original_filename,
        )

        detected_type = self.detect_document_type(
            file_bytes=file_bytes,
            original_filename=original_filename,
            declared_content_type=declared_content_type,
        )

        extracted_content = self.parse_document(
            file_bytes=file_bytes,
            document_type=detected_type,
        )

        artifact_title = (
            title.strip()
            if title and title.strip()
            else Path(original_filename).stem
        )

        normalized_artifact_type = (
            artifact_type.strip()
            if artifact_type and artifact_type.strip()
            else "document"
        )

        artifact = Artifact(
            id=str(uuid4()),
            case_id=case_id,
            node_id=node_id,
            type=normalized_artifact_type,
            title=artifact_title,
            content=extracted_content,
            extracted_content=extracted_content,
            created_by=created_by,
            source_type="uploaded",
            original_filename=original_filename,
            original_content_type=detected_type.mime_type,
            original_file_size=len(file_bytes),
            document_format=detected_type.format,
        )

        self.artifact_repository.create(artifact)

        return artifact

    @staticmethod
    def parse_document(
        *,
        file_bytes: bytes,
        document_type: DetectedDocumentType,
    ) -> str:
        parser_by_format = {
            "pdf": parse_pdf,
            "docx": parse_docx,
            "txt": parse_plain_text,
            "md": parse_plain_text,
            "json": parse_json,
            "xml": parse_xml,
            "html": parse_html,
        }

        parser = parser_by_format.get(document_type.format)

        if parser is None:
            raise UnsupportedDocumentTypeError(
                "No parser is registered for document format "
                f"'{document_type.format}'."
            )

        return parser(file_bytes)

    @staticmethod
    def detect_document_type(
        *,
        file_bytes: bytes,
        original_filename: str,
        declared_content_type: str | None,
    ) -> DetectedDocumentType:
        extension = Path(original_filename).suffix.lower()

        if file_bytes.startswith(b"%PDF-"):
            return DetectedDocumentType(
                format="pdf",
                mime_type="application/pdf",
                extension=".pdf",
            )

        if file_bytes.startswith(b"PK\x03\x04"):
            if DocumentService._is_docx(file_bytes):
                return DetectedDocumentType(
                    format="docx",
                    mime_type=(
                        "application/vnd.openxmlformats-"
                        "officedocument.wordprocessingml.document"
                    ),
                    extension=".docx",
                )

            raise UnsupportedDocumentTypeError(
                "ZIP-based documents are currently only supported "
                "when they are valid DOCX files."
            )

        if extension == ".txt":
            return DetectedDocumentType(
                format="txt",
                mime_type="text/plain",
                extension=".txt",
            )

        if extension in {".md", ".markdown"}:
            return DetectedDocumentType(
                format="md",
                mime_type="text/markdown",
                extension=extension,
            )

        if extension == ".json":
            return DetectedDocumentType(
                format="json",
                mime_type="application/json",
                extension=".json",
            )

        if extension == ".xml":
            return DetectedDocumentType(
                format="xml",
                mime_type="application/xml",
                extension=".xml",
            )

        if extension in {".html", ".htm"}:
            return DetectedDocumentType(
                format="html",
                mime_type="text/html",
                extension=extension,
            )

        content_type_mapping = {
            "text/plain": DetectedDocumentType(
                format="txt",
                mime_type="text/plain",
                extension=extension or ".txt",
            ),
            "text/markdown": DetectedDocumentType(
                format="md",
                mime_type="text/markdown",
                extension=extension or ".md",
            ),
            "application/json": DetectedDocumentType(
                format="json",
                mime_type="application/json",
                extension=extension or ".json",
            ),
            "application/xml": DetectedDocumentType(
                format="xml",
                mime_type="application/xml",
                extension=extension or ".xml",
            ),
            "text/xml": DetectedDocumentType(
                format="xml",
                mime_type="application/xml",
                extension=extension or ".xml",
            ),
            "text/html": DetectedDocumentType(
                format="html",
                mime_type="text/html",
                extension=extension or ".html",
            ),
        }

        mapped_type = content_type_mapping.get(
            declared_content_type or ""
        )

        if mapped_type is not None:
            return mapped_type

        raise UnsupportedDocumentTypeError(
            "Unsupported document format. Supported formats are: "
            "PDF, DOCX, TXT, Markdown, JSON, XML and HTML."
        )

    @staticmethod
    def _is_docx(file_bytes: bytes) -> bool:
        try:
            from io import BytesIO

            with ZipFile(BytesIO(file_bytes)) as archive:
                names = set(archive.namelist())

                return (
                    "[Content_Types].xml" in names
                    and "word/document.xml" in names
                )

        except BadZipFile:
            return False

    @staticmethod
    def _validate_upload(
        *,
        file_bytes: bytes,
        original_filename: str,
    ) -> None:
        if not original_filename:
            raise InvalidDocumentError(
                "The uploaded document has no filename."
            )

        if not file_bytes:
            raise InvalidDocumentError(
                "The uploaded document is empty."
            )

        if len(file_bytes) > MAX_DOCUMENT_SIZE_BYTES:
            max_size_mb = (
                MAX_DOCUMENT_SIZE_BYTES
                // (1024 * 1024)
            )

            raise InvalidDocumentError(
                f"The uploaded document exceeds the "
                f"{max_size_mb} MB size limit."
            )