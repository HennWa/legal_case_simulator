from __future__ import annotations

import os
from pathlib import Path

from networkx.classes import neighbors
from object_graph_runtime.graph_classes import CaseGraph, LegalNode, LegalBranchNode
from prompt_builder.prompt_builder import PromptBuilder
from llm_interface.llm_interface import BaseLLMProvider
from rag_engine.rag_engine import RAGEngine
from utils.utils import get_frontend_dir


#path_db = os.path.join(Path(__file__).resolve().parent.parent, 'local_db/law_vectorstore')
#db_name = "chroma_bgb"
#db_dir = os.path.join(path_db, db_name)


class LegalServices:

    def __init__(self, graph: CaseGraph, llm: BaseLLMProvider):
        self.graph = graph
        self.llm = llm
        self.prompt_builder = PromptBuilder()

    def legal_check(self, node_id: str) -> (LegalBranchNode, str):

        # Legal law research RAG
        print(f'RAG research for: {node_id}')
        narrative = self.graph.build_narrative(self.graph.build_path(node_id))
        rag_engine = RAGEngine()
        #rag_engine = RAGEngine(db_dir)
        rag_results_law = rag_engine.get_docs(narrative)
        print(f'RAG research done for: {node_id}')

        # legal case research
        rag_results_cases = ""

        # legal compliance check
        prompt_messages = self.prompt_builder.legal_check_node_prompt(self.graph, node_id,
                                                                      rag_results_law,
                                                                      rag_results_cases)
        branch_node = self.llm.generate(prompt_messages)

        # update extended or corrected branch
        self.graph.update_branch_obj(branch_node)
        self.graph.to_json(os.path.join(get_frontend_dir(), 'src/data/graph.json'))

        return branch_node, rag_results_law
