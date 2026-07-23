class DocumentParsingError(Exception):
    """Base exception for document parsing errors."""


class UnsupportedDocumentTypeError(DocumentParsingError):
    """Raised when the uploaded document type is not supported."""


class InvalidDocumentError(DocumentParsingError):
    """Raised when a document is malformed or cannot be parsed."""