import os
from pathlib import Path

from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

from dotenv import load_dotenv

load_dotenv(override=True)


class RAGEngine:

    def __init__(self, db, embeddings_model="text-embedding-3-large", k_docs = 7):

        self.embeddings = OpenAIEmbeddings(model=embeddings_model)
        self.k_docs = k_docs
        self.retriever = self.create_retriever(db, self.embeddings)

    def create_retriever(self, db, embeddings):
        print(f'Connecting to {db}')
        vectorstore = Chroma(persist_directory=db,
                             embedding_function=embeddings,
                             collection_name="bgb")
        retriever = vectorstore.as_retriever(search_kwargs={"k": self.k_docs})
        return retriever

    def get_docs(self, question: str) -> str:
        docs = self.retriever.invoke(question)

        content = "\n\n" + ("\n" + "=" * 80 + "\n\n").join(
            doc.page_content for doc in docs
        )

        return content

if __name__ == "__main__":

    path_db = os.path.join(Path(__file__).resolve().parent.parent, 'local_db/law_vectorstore')
    db_name = "chroma_bgb"
    db_dir = os.path.join(path_db, db_name)

    rag_engine = RAGEngine(db_dir)

    #topic = 'Haftung des Vereins für Organe'
    topic = 'Willenserklärung'

    doc_content = rag_engine.get_docs(topic)

    print(doc_content)






