import json

from object_graph_runtime.graph_classes import LegalNode


class PromptBuilder:

    @staticmethod
    def build(node: LegalNode) -> str:

        return f"""
        You are a legal process simulation engine.
        
        Current legal state:
        
        {json.dumps(node.state, indent=2)}
        
        Summary:
        {node.summary}
        
        Generate ALL realistic next legal transitions.
        
        Return STRICT JSON with:
        - transitions
        - probability
        - next_state
        - summary
        - artifacts
        
        DO NOT return prose.
        """