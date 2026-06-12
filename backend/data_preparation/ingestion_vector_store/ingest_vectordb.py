from pathlib import Path
from uuid import uuid4
import re
import os

from lxml import etree

from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

from dotenv import load_dotenv

load_dotenv(override=True)


# --------------------------------------------------
# CONFIG
# --------------------------------------------------

MAX_CHARS = 1500
OVERLAP = 200

EMBEDDING_MODEL = "text-embedding-3-large"


# --------------------------------------------------
# HELPERS
# --------------------------------------------------

def split_sentences(text: str):
    return re.split(r"(?<=[.!?])\s+", text)


def split_large_text(
    text: str,
    max_chars: int = MAX_CHARS,
    overlap: int = OVERLAP,
):
    """
    Splits a long text while keeping sentence boundaries.
    """

    if len(text) <= max_chars:
        return [text]

    sentences = split_sentences(text)

    chunks = []
    current = ""

    for sentence in sentences:

        if len(current) + len(sentence) < max_chars:
            current += " " + sentence
            continue

        chunks.append(current.strip())

        overlap_text = current[-overlap:]
        current = overlap_text + " " + sentence

    if current:
        chunks.append(current.strip())

    return chunks


# --------------------------------------------------
# XML PARSER
# --------------------------------------------------

def get_text(element):
    if element is None:
        return ""

    return " ".join(
        t.strip()
        for t in element.itertext()
        if t.strip()
    )


def parse_xml(xml_file: str):

    tree = etree.parse(xml_file)

    root = tree.getroot()

    documents = []

    current_book = ""
    current_section = ""
    current_title = ""
    current_subtitle = ""

    #
    # Die Tags müssen evtl. an dein XML angepasst werden.
    #

    for elem in root.iter():

        tag = etree.QName(elem.tag).localname.lower()

        if tag == "buch":
            current_book = get_text(elem)

        elif tag == "abschnitt":
            current_section = get_text(elem)

        elif tag == "titel":
            current_title = get_text(elem)

        elif tag == "untertitel":
            current_subtitle = get_text(elem)

        elif tag in ("norm", "paragraph"):

            paragraph_number = (
                elem.attrib.get("paragraph")
                or elem.attrib.get("id")
                or ""
            )

            heading = ""

            heading_elem = elem.find(".//enbez")
            if heading_elem is not None:
                heading = get_text(heading_elem)

            title_elem = elem.find(".//titel")
            paragraph_title = get_text(title_elem)

            absaetze = []

            #
            # Oft heißt der Absatztext:
            # textdaten / text / absatz
            #

            for absatz in elem.findall(".//absatz"):
                text = get_text(absatz)

                if text:
                    absaetze.append(text)

            if not absaetze:

                complete_text = get_text(elem)

                absaetze = [complete_text]

            hierarchy = "\n".join(
                x for x in [
                    "BGB",
                    current_book,
                    current_section,
                    current_title,
                    current_subtitle,
                ]
                if x
            )

            for idx, absatz_text in enumerate(absaetze, start=1):

                chunks = split_large_text(absatz_text)

                for chunk_idx, chunk in enumerate(chunks):

                    content = (
                        f"{hierarchy}\n\n"
                        f"{heading} {paragraph_title}\n\n"
                        f"{chunk}"
                    )

                    documents.append(
                        Document(
                            page_content=content,
                            metadata={
                                "law": "BGB",
                                "paragraph": paragraph_number,
                                "heading": heading,
                                "title": paragraph_title,
                                "book": current_book,
                                "section": current_section,
                                "legal_title": current_title,
                                "subtitle": current_subtitle,
                                "absatz": idx,
                                "chunk": chunk_idx,
                                "source": "bgb",
                            },
                            id=str(uuid4()),
                        )
                    )

    return documents


# --------------------------------------------------
# BUILD VECTORSTORE
# --------------------------------------------------

def build_vectorstore(xml_file, persist_directory):

    docs = parse_xml(xml_file)

    print(f"Created {len(docs)} chunks")

    embeddings = OpenAIEmbeddings(
        model=EMBEDDING_MODEL
    )

    vectorstore = Chroma(
        collection_name="bgb",
        embedding_function=embeddings,
        persist_directory=persist_directory,
    )

    batch_size = 200

    for i in range(0, len(docs), batch_size):

        batch = docs[i:i + batch_size]

        vectorstore.add_documents(batch)

        print(
            f"Inserted "
            f"{min(i + batch_size, len(docs))}"
            f"/{len(docs)}"
        )

    print("Finished")


if __name__ == "__main__":

    resources_path = os.path.join(Path(__file__).resolve().parent.parent.parent, 'resources')
    bgb_path =  os.path.join(resources_path, 'literature', 'bgb')
    xml_file = "BJNR001950896.xml"
    full_path_bgb = os.path.join(bgb_path, xml_file)

    path_db = os.path.join(Path(__file__).resolve().parent.parent.parent, 'local_db/law_vectorstore')
    db_name = "chroma_bgb"
    persist_directory = os.path.join(path_db, db_name)

    build_vectorstore(full_path_bgb, persist_directory)