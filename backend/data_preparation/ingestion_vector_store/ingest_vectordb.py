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


def parse_xml(xml_file: str, law_name: str = "BGB"):

    tree = etree.parse(xml_file)
    root = tree.getroot()

    documents = []

    current_book = ""
    current_section = ""
    current_title = ""
    current_subtitle = ""

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

            for absatz in elem.findall(".//absatz"):
                text = get_text(absatz)
                if text:
                    absaetze.append(text)

            if not absaetze:
                absaetze = [get_text(elem)]

            hierarchy = "\n".join(
                x for x in [
                    law_name,
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
                                "law": law_name,
                                "book": current_book,
                                "section": current_section,
                                "title": current_title,
                                "subtitle": current_subtitle,
                                "paragraph": paragraph_number,
                                "heading": heading,
                                "paragraph_title": paragraph_title,
                                "absatz": idx,
                                "chunk": chunk_idx,
                                "source_file": xml_file,
                                "source_type": "law",
                                "doc_key": f"{law_name}_{paragraph_number}_{idx}_{chunk_idx}",
                            },
                            id=str(uuid4()),
                        )
                    )

    return documents

# --------------------------------------------------
# BUILD VECTORSTORE
# --------------------------------------------------

def build_vectorstore(law_files, persist_directory):

    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)

    vectorstore = Chroma(
        collection_name="laws",
        embedding_function=embeddings,
        persist_directory=persist_directory,
    )

    all_docs = []

    for law_name, file_path in law_files:

        print(f"Parsing {law_name} from {file_path}")

        docs = parse_xml(file_path, law_name=law_name)
        all_docs.extend(docs)

        print(f"{law_name}: {len(docs)} docs")

    print(f"Total documents: {len(all_docs)}")

    batch_size = 200

    for i in range(0, len(all_docs), batch_size):

        batch = all_docs[i:i + batch_size]
        vectorstore.add_documents(batch)

        print(f"Inserted {min(i + batch_size, len(all_docs))}/{len(all_docs)}")

    print("Finished")



if __name__ == "__main__":

    print('starting ingestion')

    resources_path = os.path.join(
        Path(__file__).resolve().parent.parent.parent,
        "resources",
        "literature"
    )

    law_files = [
        ("BGB", os.path.join(resources_path, "bgb", "BJNR001950896.xml")),
        ("StGB", os.path.join(resources_path, "stgb", "BJNR001270871.xml")),
        ("AO", os.path.join(resources_path, "ao", "BJNR006130976.xml")),
        ("ErbStG", os.path.join(resources_path, "erbstg", "BJNR109330974.xml")),
        ("GewStG", os.path.join(resources_path, "gewstg", "BJNR009790936.xml")),
        ("EStG", os.path.join(resources_path, "estg", "BJNR010050934.xml")),
        ("KStG", os.path.join(resources_path, "kstg", "BJNR009790936.xml")),
        ("UStG", os.path.join(resources_path, "ustg", "BJNR119530979.xml")),
    ]

    db_path = os.path.join(
        Path(__file__).resolve().parent.parent.parent,
        "local_db/law_vectorstore",
        "chroma_laws"
    )

    build_vectorstore(law_files, db_path)