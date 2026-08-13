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



# --------------------------------- legal check prompts ---------------------------------


def legal_check_node_prompt(graph: CaseGraph, node_id: str,
                                 rag_results_law: str, rag_results_cases: str) -> dict[str, str]:

    system_prompt = legal_check_node_system_prompt()
    user_prompt = legal_check_node_user_prompt(graph=graph,
                                                             node_id=node_id,
                                                             rag_results_law=rag_results_law,
                                                             rag_results_cases=rag_results_cases)

    return {'system_prompt':system_prompt, 'user_prompt': user_prompt}


def legal_check_node_system_prompt() -> str:

    return f"""
        You are a legal expert as part of a legal process simulation engine.


        ## TASK
        You are given a legal action and the resulting legal state of a legal procedure. The legal procedure 
        is represented as a graph, where nodes represent legal states and edges represent legal events or actions 
        that transition the case from one state to another.
        
        It is your task to check last action and state of the legal procedure for legal compliance with the law.
        Add all relevant legal references that apply to the action and the state. Correct the action and the 
        resulting state if there are any legal violations or inapplicabilities of the law, like deadline passing, 
        age limits and so on. If everything is ok do not change anything in the action or state.  
            
        
        ## INPUT
        You will receive:
        1. The last legal action and state which are to be checked
        2. A causal path of past legal events
        3. A narrative summary of the case progression
        4. A selection of laws that might be relevant for the legal action and state
        
        ## DEFINITIONS
        Legal Action:
        A legal action is considered to be an actions and communication between legal parties which 
        are called actors here. Actions within one legal party for example the communication between a 
        client and his lawyer is not to be considered a legal action.
        
        A legal action can include multiple parties as for example a court date.
        
        Legal State:
        A legal state is the status between actions. Nothing is changing at that state. all relevant legal changes 
        are conducted in legal actions. A legal state summarize the outcome of the previous legal action.
        
        Here are examples of sequences of legal actions and legal states: 
        Example 1.
        Action 1: Actor requests a hearing.
        State 1: A court hearing has been requested.
        
        Action 2: Court summons parties to a hearing.
        State 2: Actors are informed about hearing.
        
        Action 3: A hearing takes place, resulting in a suspicion against actor ABC.  
        (The outcome is part of the action and must be clear in the definition of the action.
        An action can never have to following states.)
        State 3: The actor ABC is suspected by the court.
        
        
        ## INSTRUCTIONS STEP BY STEP:
        step1: Analyze the provided causal path of past legal events, 
        the narrative summary, and the last legal action and state to understand the context of the case.
        
        step2: Based on this analysis, do a research in your legal knowledge and include given laws
        to determine if the legal step is compliant with the law. Try to figure out all relevant restrictions.
        
        step3: Summarize all relevant law references and add them to the legal action and state.
        
        step4: If there are any non compliant actions involved, try to correct the legal action so that it 
        conforms with the law. ONLY IF YOU CORRECT IT, update the given legal action so that it is consistent and 
        structured. This includes:
            
            1. Describing the legal action or event that occurs (e.g., file_complaint, submit_evidence, hold_hearing).
               Check that the action is not already represented in the graph as an outgoing edge from the current node. 
            2. Identifying the actor responsible for this action, if applicable.
            3. Describe a conditions that need to be fulfilled for this action to be carried out, 
               if applicable (e.g., person above 18 years, actor has no criminal records, employment 
               relationship lasting longer than 6 months etc.)
            4. Define a start and end time for this action, ensuring that it logically follows the previous events in the case.
            5. Listing any artifacts associated with this legal action, if applicable (e.g., legal documents, evidence).
               Create the artifact or document if it does not exist yet in the graph, and link it to the action.
            6. Provide all relevant legal references (e.g., laws, regulations, case precedents) that 
               support the plausibility of this action, if applicable.
            7. Estimating the probability of this legal action being conducted successfully
               based on the context of the case and the past events and all states of the actors. 
               The value must be in the range 0-1.
            8. Describe if a lawyer needs to involved for this action to be carried out.
            9. Estimate all relevant expenses and income for each actor.
                    
        step5: Ensure that the resulting output is fully structured and 
              consistent with the legal context of the case. This includes:
              
            1. Defining the legal state that results from the action, including all relevant attributes and their values.
            2. The start and end times fit together.
            3. The actor status is updated accordingly, including any income and expenses.
            4. The summary of the new state clearly describes the new legal state and how it relates to the 
               previous state and the overall case progression.


        ## OUTPUT FORMAT:
        - Only output valid JSON
        - Never output explanations outside JSON
        - Your output must be strictly in this format:

        {schema_json_single_node}

        
        ## GENERAL GUIDELINES:
        - Consider legal procedural logic and realistic human behavior
        - Ensure the output is fully structured and consistent
        - Do not hallucinate laws
        - Ensure the transition is realistic and legally plausible
        - DO NOT CHANGE THE ID OF THE LEGAL NODE OR THE LEGAL EDGE

        """

def legal_check_node_user_prompt(graph: CaseGraph, node_id: str,
                                 rag_results_law: str, rag_results_cases: str) -> str:

    # 1. Build path
    path = graph.build_path(node_id)

    # 2. Build narrative
    narrative = graph.build_narrative(path)

    # 3. Branch
    branch = graph.get_branch_of_node(node_id)

    return f"""
    # LAST LEGAL ACTION AND LEGAL STATE (TO BE CHECKED)

    {json.dumps(branch.model_dump(), indent=2)}

    ---
    
    
    # CAUSAL PATH (STRUCTURED)

    {json.dumps([step.model_dump() for step in path], indent=2)}

    ---

    # NARRATIVE SUMMARY

    {narrative}

    ---

    # SELECTION OF RELEVANT LAWS

    {rag_results_law}


    ---

    TASK:
    Check the last legal state and action for conformity with law and correct if necessary.
    """

