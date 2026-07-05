import json
from backend.object_graph_runtime.graph_classes import LegalBranchNode, LegalBranches

from backend.object_graph_runtime.graph_classes import CaseGraph



schema_json_multiple_nodes = json.dumps(
    LegalBranches.model_json_schema(),
    indent=2
)

schema_json_single_node = json.dumps(
    LegalBranchNode.model_json_schema(),
    indent=2
)


class PromptBuilder:

    #--------------------------------- node expansion prompts ---------------------------------

    @staticmethod
    def create_expand_node_prompt(graph: CaseGraph, node_id: str) -> dict[str,str]:

        system_prompt = PromptBuilder.create_expand_node_system_prompt()
        user_prompt = PromptBuilder.create_expand_node_user_prompt(graph, node_id)

        return {'system_prompt':system_prompt, 'user_prompt': user_prompt}


    @staticmethod
    def create_expand_node_system_prompt() -> str:
        SYSTEM_PROMPT = f"""
            You are a legal process simulation engine.

            ## TASK
            Your task is to simulate the next most probably step in a legal procedure. The legal procedure is represented 
            as a graph, where nodes represent legal states and edges represent legal events or actions that transition 
            the case from one state to another. Create a branch to extend the legal case based on the current state 
            and past events.
            
            You may be given given actions that are already contained in the graph as possible actions. You should find a new 
            action that is not yet contained in the graph but is still a realistic next step with a meaningful probability.
            
            
            ## INPUT
            You will receive:
            1. A causal path of past legal events
            2. A narrative summary of the case progression
            3. The current legal state
            4. Existing outgoing edges containing the action types of already existing transitions from the current node
            5. Existing outgoing probabilities of already existing transitions from the current node
            
            
            ## INSTRUCTIONS STEP BY STEP:
            step1: Analyze the provided causal path of past legal events, 
            the narrative summary, and the current legal state to understand the context of the case.
            
            step2: Based on this analysis, do a quick research in your legal knowledge to find a realistic 
            and legally plausible next step that is not yet represented in the graph.
            
            step3: Describe the next legal step in detail and research all the necessary information to create a 
            consistent and structured next step. This includes:
                
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
                7. Estimating the probability of this legal action occurring based on the context of the case and the past events. 
                   Ensure that probability is correct in relation to other outgoing edges from the node. The sum of all 
                   probabilities should be a value < 1.0
                8. Describe if a lawyer needs to involved for this action to be carried out.
                
            step4: Generate the content of all relevant artifacts and documents that are associated with this legal 
            action, if applicable. 
                - Provide full documents like emails, letters, contracts etc. that are relevant for the legal action and 
                state.
                - The content must be written in a formal and legally plausible way, as if it were written by a lawyer. 
                  The document should have the quality so that they can be directly used in a real legal case. 
                - The document maust be consistent with the legal action and state.
            
            step5: Ensure that the next state resulting from this action is fully structured and 
                  consistent with the legal context of the case. This includes:
                  
                1. Defining the legal state that results from the action, including all relevant attributes and their values.
                2. The start and end times fit together.
                3. The actor status is updated accordingly, including any payments made or received.
                4. The summary of the new node clearly describes the new legal state and how it relates to the 
                   previous state and the overall case progression.
  
  
            ## OUTPUT FORMAT:
            - Only output valid JSON
            - Never output explanations outside JSON
            - Your output must be strictly in this format:

            {schema_json_single_node}

            
            ## GENERAL GUIDELINES:
            - Consider legal procedural logic and realistic human behavior
            - Ensure next_state is fully structured and consistent
            - Do not hallucinate laws unless explicitly provided in input
            - Ensure the transition is realistic and legally plausible

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

    # --------------------------------- legal check prompts ---------------------------------

    @staticmethod
    def legal_check_node_prompt(graph: CaseGraph, node_id: str,
                                     rag_results_law: str, rag_results_cases: str) -> dict[str, str]:

        system_prompt = PromptBuilder.legal_check_node_system_prompt()
        user_prompt = PromptBuilder.legal_check_node_user_prompt(graph=graph,
                                                                 node_id=node_id,
                                                                 rag_results_law=rag_results_law,
                                                                 rag_results_cases=rag_results_cases)

        return {'system_prompt':system_prompt, 'user_prompt': user_prompt}


    @staticmethod
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
            4. A selection of laws relevant for the legal action and state
            5. A selection of law cases relevant for the legal action and state 

            
            ## INSTRUCTIONS STEP BY STEP:
            step1: Analyze the provided causal path of past legal events, 
            the narrative summary, and the last legal action and state to understand the context of the case.
            
            step2: Based on this analysis, do a research in your legal knowledge and including given laws and law cases
            to determine if the legal step is compliant with the law. Try to figure out all relevant restrictions.
            
            step3: Summarize all relevant law references and add them to the legal action and state.
            
            step4: If the are any non compliant actions involved, try to correct the legal action so that it 
            conforms with the law. ONLY IF YOU CORRECT IT, update the given legal action so that it is consistent and 
            structured. This includes:
                
                1. Describing the legal action or event that occurs (e.g., file_complaint, submit_evidence, hold_hearing).
                   Check that the action is not already represented in the graph as an outgoing edge from the current node. 
                2. Identifying the actor responsible for this action, if applicable.
                3. Describe a conditions that need to be fulfilled for this action to be carried out, 
                   if applicable (e.g., person above 18 years, actor has no criminal recors, employment 
                   relationship lasting longer than 6 months etc.)
                4. Define a start and end time for this action, ensuring that it logically follows the previous events in the case.
                5. Listing any artifacts associated with this legal action, if applicable (e.g., legal documents, evidence).
                   Create the artifact or document if it does not exist yet in the graph, and link it to the action.
                6. Provide all relevant legal references (e.g., laws, regulations, case precedents) that 
                   support the plausibility of this action, if applicable.
                7. Estimating the probability of this legal action occurring based on the context of the case and the past events. 
                   Ensure that probability is correct in relation to other outgoing edges from the node. The sum of all 
                   probabilities should be a value < 1.0
                8. describe if a lawyer needs to involved for this action to be carried out.
            
            step5: Ensure that the resulting output is fully structured and 
                  consistent with the legal context of the case. This includes:
                  
                1. Defining the legal state that results from the action, including all relevant attributes and their values.
                2. The start and end times fit together.
                3. The actor status is updated accordingly, including any payments made or received.
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

    @staticmethod
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

        # SELECTION OF RELEVANT LEGAL CASES

        {rag_results_cases}

        ---

        TASK:
        Check the last legal state and action for conformity with law and correct if necessary.
        """

