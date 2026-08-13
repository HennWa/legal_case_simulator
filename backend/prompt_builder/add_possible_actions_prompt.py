import json
from backend.object_graph_runtime.graph_classes import PossibleActions

from backend.object_graph_runtime.graph_classes import CaseGraph


schema_json_possible_actions = json.dumps(
    PossibleActions.model_json_schema(),
    indent=2,
)



# --------------------------------- node by action expansion prompts ---------------------------------

def create_add_possible_actions_prompt(graph: CaseGraph, node_id: str) -> dict[str, str]:

    system_prompt = create_possible_actions_system_prompt()
    user_prompt = create_possible_actions_user_prompt(graph, node_id)

    return {'system_prompt': system_prompt, 'user_prompt': user_prompt}


def create_possible_actions_system_prompt() -> str:
    SYSTEM_PROMPT = f"""
        You are a legal process simulation engine.

        ## TASK
        Your task is to propose possible next action in a legal procedure based on the current state of the 
        case and the past events.
        
        The legal procedure is represented 
        as a graph, where nodes represent legal states and edges represent legal events or actions that transition 
        the case from one state to another. Add the most possible next legal actions to the current state.
        
        Do not change any other information in the current state (node) or the action before (edge leading to the node).
        Only propose the next possible legal actions that could follow the current state.

        ## INPUT
        You will receive:
        1. A causal path of past legal events
        2. A narrative summary of the case progression
        3. The current legal state

    
        ## INSTRUCTIONS STEP BY STEP:
        step1: Analyze the provided causal path of past legal events, 
        the narrative summary, and the current legal state to understand the context of the case.
   
        step2: Based on the current state, describe the most likely potential next actions (3-5) 
           that could follow this action in a list. 
           Use your legal knowledge to find the most realistic following options for actions.
           Use not more than four words for each action.

        ## OUTPUT FORMAT:
        - Only output valid JSON
        - Never output explanations outside JSON
        - Your output must be strictly in this format:

        {schema_json_possible_actions}

        ## GENERAL GUIDELINES:
        - Consider legal procedural logic and realistic human behavior
        - Ensure the proposed actions are legally plausible and contextually relevant
        - Do not hallucinate laws unless explicitly provided in input

        """

    return SYSTEM_PROMPT


def create_possible_actions_user_prompt(graph: CaseGraph, node_id: str) -> str:
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
           Add the next possible most likely actions to the current state and do not change anything else.
           """

