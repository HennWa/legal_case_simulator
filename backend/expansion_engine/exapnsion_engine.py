from __future__ import annotations

import os

from networkx.classes import neighbors
from backend.object_graph_runtime.graph_classes import CaseGraph, LegalNode, LegalBranchNode, ArtifactCollection
from backend.prompt_builder.prompt_builder import PromptBuilder
from backend.llm_interface.llm_interface import BaseLLMProvider
from backend.utils.utils import get_frontend_dir

class ExpansionEngine:

    def __init__(self, graph: CaseGraph, llm: BaseLLMProvider):
        self.graph = graph
        self.llm = llm
        self.prompt_builder = PromptBuilder()
        self.number_default_branches = 3

    def expand_node(self, node_id: str) -> LegalBranchNode:

        prompt_messages = self.prompt_builder.create_expand_node_prompt(self.graph, node_id)
        branch_node = self.llm.generate(prompt_messages)

        if branch_node.node.id in self.graph.nodes:
            raise ValueError(f"Node with id {branch_node.node.id} already exists in the graph. ID collision detected.")

        branch_node = self.graph.add_branch_obj(source_id=node_id, branch_node=branch_node)
        self.graph.to_json(os.path.join(get_frontend_dir(), 'src/data/graph.json'))

        return branch_node

    def expand_node_by_action(self, node_id: str, action: str) -> LegalBranchNode:

        prompt_messages = self.prompt_builder.create_expand_node_by_action_prompt(self.graph, node_id, action)
        branch_node = self.llm.generate(prompt_messages)

        if branch_node.node.id in self.graph.nodes:
            raise ValueError(f"Node with id {branch_node.node.id} already exists in the graph. ID collision detected.")

        branch_node = self.graph.add_branch_obj(source_id=node_id, branch_node=branch_node)
        self.graph.to_json(os.path.join(get_frontend_dir(), 'src/data/graph.json'))

        return branch_node

    def expand_node_with_multiple(self, node_id: str) -> list[LegalNode]:
        pass


    def create_artifacts(self, edge_id: str) -> ArtifactCollection:

        prompt_messages = self.prompt_builder.create_artifacts_prompt(self.graph, edge_id)
        artifact_collection = self.llm.generate_artifacts(prompt_messages)

        artifact_collection.artifacts = [self.graph.add_artifact(art, edge_id) for art in artifact_collection.artifacts]

        self.graph.to_json(os.path.join(get_frontend_dir(), 'src/data/graph.json'))

        return artifact_collection

