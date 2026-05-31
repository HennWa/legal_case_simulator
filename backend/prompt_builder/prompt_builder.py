import json
from backend.object_graph_runtime.graph_classes import LegalBranches

from backend.object_graph_runtime.graph_classes import CaseGraph


schema_json = json.dumps(
    LegalBranches.model_json_schema(),
    indent=2
)

SYSTEM_PROMPT = f"""
You are a legal process simulation engine.

Your task is to simulate possible next steps in a legal procedure.
Create branches to extend the legal case based on the current state and past events.

You MUST:
- Only output valid JSON
- Never output explanations outside JSON
- Consider legal procedural logic and realistic human behavior
- Use probabilities for each transition (0.0 to 1.0)
- Ensure next_state is fully structured and consistent
- In the node -> state -> actor_status write every existing actor with a random amount in the field paid

You will receive:
1. A causal path of past legal events
2. A narrative summary of the case progression
3. The current legal state

Your output must be strictly in this format:

{schema_json}

Rules:
- Do not hallucinate laws unless explicitly provided in input
- Ensure transitions are realistic and legally plausible
- Ensure probabilities across branches do not need to sum to 1, but should be meaningful
"""


class PromptBuilder:

    @staticmethod
    def create_prompt_messages(graph: CaseGraph, node_id: str) -> dict[str,str]:

        user_prompt = PromptBuilder.create_user_prompt(graph, node_id)

        return {'system_prompt':SYSTEM_PROMPT, 'user_prompt': user_prompt}


    @staticmethod
    def create_user_prompt(graph: CaseGraph, node_id: str) -> str:

        # 1. Build path
        path = graph.build_path(node_id)

        # 2. Build narrative
        narrative = graph.build_narrative(path)

        # 3. Current node
        node = graph.nodes[node_id]

        return f"""
        # CAUSAL PATH (STRUCTURED)

        {json.dumps([step.model_dump() for step in path], indent=2)}

        ---

        # NARRATIVE SUMMARY

        {narrative}

        ---

        # CURRENT LEGAL STATE

        {json.dumps(node.state.model_dump(), indent=2)}

        ---

        # CURRENT NODE SUMMARY

        {node.summary}

        ---

        TASK:
        Generate three possible next branches consisting of legal edges and nodes from the current state.
        """