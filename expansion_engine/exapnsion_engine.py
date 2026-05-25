import json

from __future__ import annotations
from object_graph_runtime.graph_classes import CaseGraph, Artifact, generate_id
from prompt_builder.prompt_builder import PromptBuilder
from llm_interface.llm_interface import BaseLLMProvider


class ExpansionEngine:

    def __init__(self, graph: CaseGraph, llm: BaseLLMProvider):
        self.graph = graph
        self.llm = llm

    def expand_node(self, node_id: str):

        node = self.graph.nodes[node_id]

        # -------------------------
        # Build prompt
        # -------------------------
        prompt = PromptBuilder.build(node)

        # -------------------------
        # Call LLM
        # -------------------------
        raw_response = self.llm.generate(prompt)

        # -------------------------
        # Parse JSON
        # -------------------------
        data = json.loads(raw_response)

        created_nodes = []

        # -------------------------
        # Create transitions
        # -------------------------
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