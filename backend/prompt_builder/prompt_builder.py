import json
from object_graph_runtime.graph_classes import LegalBranchNode, LegalBranches

from object_graph_runtime.graph_classes import CaseGraph


schema_json_multiple_nodes = json.dumps(
    LegalBranches.model_json_schema(),
    indent=2
)

schema_json_single_node = json.dumps(
    LegalBranchNode.model_json_schema(),
    indent=2
)


class PromptBuilder:

    @staticmethod
    def create_expand_node_prompt(graph: CaseGraph, node_id: str) -> dict[str,str]:

        system_prompt = PromptBuilder.create_expand_node_system_prompt()
        user_prompt = PromptBuilder.create_expand_node_user_prompt(graph, node_id)

        return {'system_prompt':system_prompt, 'user_prompt': user_prompt}


    @staticmethod
    def create_expand_node_system_prompt() -> str:
        SYSTEM_PROMPT = f"""
            You are a legal process simulation engine.

            Your task is to simulate the next most probably step in a legal procedure.
            Create branches to extend the legal case based on the current state and past events.

            You MUST:
            - Only output valid JSON
            - Never output explanations outside JSON
            - Consider legal procedural logic and realistic human behavior
            - You may be given given actions that are already contained in the graph as possible actions. You should find a new 
              action that is not yet contained in the graph but is still a realistic next step with a meaningful 
              probability.
            - Estimate the probability of this transition. You may be provided with the existing outgoing probabilities at 
              the current state, so you can estimate how likely this new transition is in comparison to the existing ones. 
              The sum of all probabilities should be a value < 1.0.
            - Ensure next_state is fully structured and consistent
            - In the node -> state -> actor_status write every existing actor with a random amount in the field paid

            You will receive:
            1. A causal path of past legal events
            2. A narrative summary of the case progression
            3. The current legal state
            4. Existing outgoing edges containing the action types of already existing transitions from the current node
            5. Existing outgoing probabilities of already existing transitions from the current node
            
            Your output must be strictly in this format:

            {schema_json_single_node}

            Rules:
            - Do not hallucinate laws unless explicitly provided in input
            - Ensure the transition is realistic and legally plausible
            - Ensure probabilities across all outgoing edges including the new one are < 1
            - Also describe the resulting state a clear as possible in the summary field to ensure 
            the state is well connected to the narrative and the path.
            """

        return SYSTEM_PROMPT

    @staticmethod
    def create_expand_node_user_prompt(graph: CaseGraph, node_id: str) -> str:
        # 1. Build path
        path = graph.build_path(node_id)

        # 2. Build narrative
        narrative = graph.build_narrative(path)

        # 3. Current node
        node = graph.nodes[node_id]

        # 4 Already existing outgoing edges and probabilities
        outgoing_edges = graph.get_outgoing_edges(node_id)
        outgoing_action_types = [edge.action_type for edge in outgoing_edges]
        if len(outgoing_edges) > 0:
            outgoing_probability_at_state = [edge.probability for edge in outgoing_edges]
        else:
            outgoing_probability_at_state = []

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

               # EXISTING OUTGOING EDGES (ACTIONS)

               {outgoing_action_types}

               ---
               
               # EXISTING OUTGOING PROBABILITIES

               {outgoing_probability_at_state}

               ---

               TASK:
               Generate the most possible next branch consisting of a legal edge and node from the current state.
               """


    @staticmethod
    def create_prompt_messages(graph: CaseGraph, node_id: str) -> dict[str,str]:

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

        {schema_json_multiple_nodes}

        Rules:
        - Do not hallucinate laws unless explicitly provided in input
        - Ensure transitions are realistic and legally plausible
        - Ensure probabilities across branches do not need to sum to 1, but should be meaningful
        """

        user_prompt = PromptBuilder.create_user_prompt_test(graph, node_id)

        return {'system_prompt':SYSTEM_PROMPT, 'user_prompt': user_prompt}


    @staticmethod
    def create_user_prompt_test(graph: CaseGraph, node_id: str) -> str:

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