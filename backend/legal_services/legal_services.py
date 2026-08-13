from __future__ import annotations

import os
from pathlib import Path

from networkx.classes import neighbors
from backend.object_graph_runtime.graph_classes import CaseGraph, LegalNode, LegalBranchNode
from backend.prompt_builder.prompt_builder import PromptBuilder
from backend.llm_interface.llm_interface import BaseLLMProvider
from backend.rag_engine.rag_engine import RAGEngine
from backend.utils.utils import get_frontend_dir


#path_db = os.path.join(Path(__file__).resolve().parent.parent, 'local_db/law_vectorstore')
#db_name = "chroma_bgb"
#db_dir = os.path.join(path_db, db_name)


class LegalServices:

    def __init__(self, graph: CaseGraph, llm: BaseLLMProvider):
        self.graph = graph
        self.llm = llm
        self.prompt_builder = PromptBuilder()

    def legal_check(self, node_id: str):

        node = self.graph.get_node(node_id)

        print(f"RAG research for: {node_id}")

        path = self.graph.build_path(node_id)
        narrative = self.graph.build_narrative(path)

        rag_engine = RAGEngine()
        rag_results_law = rag_engine.get_docs(narrative)

        print(f"RAG research done for: {node_id}")

        rag_results_cases = ""

        # -------------------------------------------------
        # Root node: check state only
        # -------------------------------------------------

        if len(node.incoming) == 0:

            prompt_messages = (
                self.prompt_builder
                .legal_check_initial_node_prompt(
                    self.graph,
                    node_id,
                    rag_results_law,
                    rag_results_cases,
                )
            )

            checked_node = self.llm.generate_node(
                prompt_messages
            )

            # Never trust LLM-generated topology.
            checked_node.id = node_id

            self.graph.update_node_obj(
                checked_node
            )

            result = checked_node

        # -------------------------------------------------
        # Normal node: check incoming action + state
        # -------------------------------------------------

        elif len(node.incoming) == 1:

            prompt_messages = (
                self.prompt_builder
                .legal_check_node_prompt(
                    self.graph,
                    node_id,
                    rag_results_law,
                    rag_results_cases,
                )
            )

            branch_node = self.llm.generate(
                prompt_messages
            )

            # Explicitly preserve IDs.
            original_edge = (
                self.graph.get_incoming_edges(
                    node_id
                )[0]
            )

            branch_node.node.id = node_id
            branch_node.edge.id = original_edge.id

            self.graph.update_branch_obj(
                branch_node
            )

            result = branch_node

        else:
            raise ValueError(
                f"Node '{node_id}' has "
                f"{len(node.incoming)} incoming edges. "
                "Legal check currently requires a unique "
                "causal predecessor."
            )

        self.graph.to_json(
            os.path.join(
                get_frontend_dir(),
                "src/data/graph.json",
            )
        )

        return result, rag_results_law
