import json
import xml.etree.ElementTree as ElementTree

from bs4 import BeautifulSoup

from backend.document_parsers.parser_exceptions import InvalidDocumentError


TEXT_ENCODINGS = (
    "utf-8-sig",
    "utf-8",
    "utf-16",
    "utf-16-le",
    "utf-16-be",
    "cp1252",
    "latin-1",
)


def decode_text(file_bytes: bytes) -> str:
    """
    Decode a text-based document using common encodings.

    UTF-8 is preferred. Windows-1252 and Latin-1 are fallbacks because
    legal documents exported from older Windows applications frequently
    use these encodings.
    """
    for encoding in TEXT_ENCODINGS:
        try:
            return file_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue

    raise InvalidDocumentError(
        "The document text encoding could not be detected."
    )


def parse_plain_text(file_bytes: bytes) -> str:
    return decode_text(file_bytes).strip()


def parse_json(file_bytes: bytes) -> str:
    text = decode_text(file_bytes)

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise InvalidDocumentError(
            "The uploaded JSON document is invalid."
        ) from exc

    return json.dumps(
        data,
        ensure_ascii=False,
        indent=2,
    )


def parse_xml(file_bytes: bytes) -> str:
    try:
        root = ElementTree.fromstring(file_bytes)
    except ElementTree.ParseError as exc:
        raise InvalidDocumentError(
            "The uploaded XML document is invalid."
        ) from exc

    extracted_parts: list[str] = []

    for element in root.iter():
        if element.text and element.text.strip():
            extracted_parts.append(element.text.strip())

    return "\n".join(extracted_parts).strip()


def parse_html(file_bytes: bytes) -> str:
    html = decode_text(file_bytes)

    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception as exc:
        raise InvalidDocumentError(
            "The uploaded HTML document could not be parsed."
        ) from exc

    for element in soup(
        [
            "script",
            "style",
            "noscript",
            "template",
        ]
    ):
        element.decompose()

    return soup.get_text(
        separator="\n",
        strip=True,
    )