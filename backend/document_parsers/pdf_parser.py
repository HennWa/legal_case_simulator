import fitz

from backend.document_parsers.parser_exceptions import InvalidDocumentError


def parse_pdf(file_bytes: bytes) -> str:
    """
    Extract text from a PDF document.

    This parser extracts embedded PDF text. It does not perform OCR on
    scanned pages.
    """
    try:
        document = fitz.open(
            stream=file_bytes,
            filetype="pdf",
        )
    except Exception as exc:
        raise InvalidDocumentError(
            "The uploaded PDF could not be opened."
        ) from exc

    try:
        pages: list[str] = []

        for page_number, page in enumerate(document, start=1):
            page_text = page.get_text("text").strip()

            if page_text:
                pages.append(page_text)

        return "\n\n".join(pages).strip()

    except Exception as exc:
        raise InvalidDocumentError(
            "Text could not be extracted from the uploaded PDF."
        ) from exc

    finally:
        document.close()