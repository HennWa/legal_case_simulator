import json
from backend.object_graph_runtime.graph_classes import LegalBranchNode, LegalBranches, ArtifactCollection

from backend.object_graph_runtime.graph_classes import CaseGraph

from backend.prompt_builder.expand_node_prompt import create_expand_node_by_action_prompt, create_expand_node_prompt
from backend.prompt_builder.legal_check_prompt import legal_check_node_prompt, legal_check_initial_node_prompt
from backend.prompt_builder.create_artifacts_prompt import create_artifacts_prompt
from backend.prompt_builder.add_possible_actions_prompt import create_add_possible_actions_prompt




class PromptBuilder:

    # --------------------------------- node by action expansion prompts ---------------------------------

    @staticmethod
    def create_expand_node_by_action_prompt(graph: CaseGraph, node_id: str, action:str) -> dict[str, str]:

        return create_expand_node_by_action_prompt(graph=graph, node_id=node_id, action=action)


    #--------------------------------- node expansion prompts ---------------------------------

    @staticmethod
    def create_expand_node_prompt(graph: CaseGraph, node_id: str) -> dict[str,str]:

        return create_expand_node_prompt(graph = graph, node_id = node_id)


    # --------------------------------- legal check prompts ---------------------------------

    @staticmethod
    def legal_check_node_prompt(graph: CaseGraph, node_id: str,
                                     rag_results_law: str, rag_results_cases: str) -> dict[str, str]:

        return legal_check_node_prompt(graph = graph, node_id = node_id,
                                     rag_results_law = rag_results_law, rag_results_cases = rag_results_cases)

    # --------------------------------- legal check initial prompts ---------------------------------
    @staticmethod
    def legal_check_initial_node_prompt(graph: CaseGraph,node_id: str, rag_results_law: str, rag_results_cases: str):

        return legal_check_initial_node_prompt(graph=graph, node_id=node_id,
            rag_results_law=rag_results_law,
            rag_results_cases=rag_results_cases,
        )

    # --------------------------------- create artifacts prompts ---------------------------------

    @staticmethod
    def create_artifacts_prompt(graph: CaseGraph, edge_id: str) -> dict[str, str]:

        return create_artifacts_prompt(graph = graph, edge_id = edge_id)

    # --------------------------------- add possible actions prompts ---------------------------------

    @staticmethod
    def create_add_possible_actions_prompt(graph: CaseGraph, node_id: str) -> dict[str, str]:

        return create_add_possible_actions_prompt(graph = graph, node_id = node_id)