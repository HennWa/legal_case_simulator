from __future__ import annotations

import json

from object_graph_runtime.graph_classes import CaseGraph, Artifact, generate_id
from prompt_builder.prompt_builder import PromptBuilder
from llm_interface.llm_interface import BaseLLMProvider


class ExpansionEngine:

    def __init__(self, graph: CaseGraph, llm: BaseLLMProvider):
        self.graph = graph
        self.llm = llm
        self.prompt_builder = PromptBuilder()

    def expand_node(self, node_id: str):

        prompt_messages = self.prompt_builder.create_prompt_messages(self.graph, node_id)
        legal_branches = self.llm.generate(prompt_messages)

        # here to read now legal branch object

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

            created_nodes.append(next_node)

        return created_nodes