import json
from backend.object_graph_runtime.graph_classes import LegalBranchNode, LegalBranches, ArtifactCollection

from backend.object_graph_runtime.graph_classes import CaseGraph



schema_json_multiple_nodes = json.dumps(
    LegalBranches.model_json_schema(),
    indent=2
)

schema_json_single_node = json.dumps(
    LegalBranchNode.model_json_schema(),
    indent=2
)

schema_json_artifacts = json.dumps(
    ArtifactCollection.model_json_schema(),
    indent=2
)

# --------------------------------- create artifacts prompts ---------------------------------


def create_artifacts_prompt(graph: CaseGraph, edge_id: str) -> dict[str, str]:
    system_prompt = create_artifacts_system_prompt()
    user_prompt = create_artifacts_user_prompt(graph, edge_id)

    return {'system_prompt': system_prompt, 'user_prompt': user_prompt}


def create_artifacts_system_prompt() -> str:
    SYSTEM_PROMPT = f"""
            You are a legal document creator.

            ## TASK
            Your task is to create all relevant documents for a given legal action which is part of a 
            legal procedure. 

            The legal procedure is represented as a graph, where nodes represent legal states and edges represent 
            legal events or actions that transition the case from one state to another. Create the relevant 
            documents for the given legal action.

            ## INPUT
            You will receive:
            1. A causal path of past legal events
            2. A narrative summary of the case progression
            3. The last legal state which is followed by the action.
            4. The legal action for which the document need to be created for.

            ## INSTRUCTIONS STEP BY STEP:
            step1: Analyze the provided causal path of past legal events, 
            the narrative summary, and the current legal state to understand the context of the case.

            step2: Based on the given legal state and action determine the needed documents to carry out the action.
            Those can be contracts, emails, evidences etc. If there is no documents required return an empty dict.
             
            step3: Generate the content of all relevant artifacts and documents that are associated with this legal 
            action, if applicable. 
            
                - Provide full documents like emails, letters, contracts etc. that are relevant for the legal action and 
                state.
                - Address the relevant actors where applicable.
                - The content must be written in a formal and legally plausible way, as if it were written by a lawyer. 
                The document should have the quality so that they can be directly used in a real legal case. 
                - The document maust be consistent with the legal action and state.
                
                Use only the field 'content' for the document content. Leave all other fields empty. 
            
            ## OUTPUT FORMAT:
            - Only output valid JSON
            - Never output explanations outside JSON
            - Your output must be strictly in this format:

            {schema_json_artifacts}

            ## GENERAL GUIDELINES:
            - Consider legal procedural logic and realistic human behavior
            - Ensure next_state is fully structured and consistent
            - Do not hallucinate laws unless explicitly provided in input
            - Ensure the transition is realistic and legally plausible

            """

    return SYSTEM_PROMPT


def create_artifacts_user_prompt(graph: CaseGraph, edge_id: str) -> str:

    # 1. Current edge
    edge = graph.edges[edge_id]

    # 2. Current node
    node = graph.nodes[edge.source_id]

    # 3. Build path
    path = graph.build_path(edge.source_id)

    # 4. Build narrative
    narrative = graph.build_narrative(path)

    return f"""
               # CAUSAL PATH (STRUCTURED)

               {json.dumps([step.model_dump() for step in path], indent=2)}

               ---

               # NARRATIVE SUMMARY

               {narrative}

               ---

               # LAST LEGAL STATE

               {json.dumps(node.state.model_dump(), indent=2)}

               ---

               # LAST STATE SUMMARY

               {node.summary}

               ---

               # NEXT LEGAl ACTION TO BE CARRIED OUT

               {json.dumps(edge.model_dump(), indent=2)}

               ---

               TASK:
               Generate all relevant documents associated with the legal action.
               """



