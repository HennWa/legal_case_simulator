from __future__ import annotations

import json

from object_graph_runtime.graph_classes import CaseGraph, Artifact, generate_id, LegalNode
from prompt_builder.prompt_builder import PromptBuilder
from llm_interface.llm_interface import BaseLLMProvider


class ExpansionEngine:

    def __init__(self, graph: CaseGraph, llm: BaseLLMProvider):
        self.graph = graph
        self.llm = llm
        self.prompt_builder = PromptBuilder()

    def expand_node(self, node_id: str) -> list[LegalNode]:

        prompt_messages = self.prompt_builder.create_prompt_messages(self.graph, node_id)
        legal_branches = self.llm.generate(prompt_messages)

        created_nodes = []
        for branch_node in legal_branches.branches:
            if branch_node.node.id in self.graph.nodes:
                raise ValueError(f"Node with id {branch_node.node.id} already exists in the graph. ID collision detected.")
            self.graph.add_branch_obj(source_id=node_id, branch_node=branch_node)
            created_nodes.append(branch_node.node)

        '''
        data = json.loads(raw_response)

        created_nodes = []
        for transition in data["transitions"]:

            # Create next node
            next_node = self.graph.add_node(
                title=transition["action_type"],
                state=transition["next_state"],
                summary=transition["summary"]
            )

            # Add artifacts
            for art in transition.get("artifacts", []):

                artifact = Artifact(
                    id=generate_id("artifact"),
                    type=art["type"],
                    content=art["content"]
                )

                next_node.artifacts.append(artifact)

            # Create edge
            self.graph.add_edge(
                source_id=node.id,
                target_id=next_node.id,
                action_type=transition["action_type"],
                probability=transition["probability"]
            )

            created_nodes.append(next_node)'''

        return created_nodes