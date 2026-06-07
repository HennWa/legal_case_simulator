from __future__ import annotations

import os

from networkx.classes import neighbors
from object_graph_runtime.graph_classes import CaseGraph, LegalNode
from prompt_builder.prompt_builder import PromptBuilder
from llm_interface.llm_interface import BaseLLMProvider
from utils.utils import get_frontend_dir

class ExpansionEngine:

    def __init__(self, graph: CaseGraph, llm: BaseLLMProvider):
        self.graph = graph
        self.llm = llm
        self.prompt_builder = PromptBuilder()
        self.number_default_branches = 3

    def expand_node(self, node_id: str) -> list[LegalNode]:


        prompt_messages = self.prompt_builder.create_expand_node_prompt(self.graph, node_id)
        branch_node = self.llm.generate(prompt_messages)

        if branch_node.node.id in self.graph.nodes:
            raise ValueError(f"Node with id {branch_node.node.id} already exists in the graph. ID collision detected.")

        self.graph.add_branch_obj(source_id=node_id, branch_node=branch_node)
        self.graph.to_json(os.path.join(get_frontend_dir(), 'src/data/graph.json'))

        return branch_node.node

    def expand_node_with_multiple(self, node_id: str) -> list[LegalNode]:

        prompt_messages = self.prompt_builder.create_prompt_messages(self.graph, node_id)
        legal_branches = self.llm.generate(prompt_messages)

        created_nodes = []
        for branch_node in legal_branches.branches:
            if branch_node.node.id in self.graph.nodes:
                raise ValueError(f"Node with id {branch_node.node.id} already exists in the graph. ID collision detected.")
            self.graph.add_branch_obj(source_id=node_id, branch_node=branch_node)
            created_nodes.append(branch_node.node)

        self.graph.to_json(os.path.join(get_frontend_dir(), 'src/data/graph.json'))

        return created_nodes