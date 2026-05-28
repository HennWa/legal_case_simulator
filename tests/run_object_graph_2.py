import os
from dotenv import load_dotenv

from object_graph_runtime.graph_classes import CaseGraph, LegalState
from expansion_engine.exapnsion_engine import ExpansionEngine
from llm_interface.llm_interface import MockLLMProvider
import json

if __name__ == "__main__":

    load_dotenv(override=True)
    openai_api_key = os.getenv('OPENAI_API_KEY')

    graph = CaseGraph()


    state = LegalState(
        phase ="Payment reminder sent",
        legal_issue="Debtor has not paid the invoice after a reminder was sent.",
        status="Overdue",
    )

    # Initial node
    start = graph.add_node(
        title="Invoice Overdue",
        state=state,
        summary="Invoice overdue after reminder."
    )

    # Expansion engine
    llm = MockLLMProvider(key=openai_api_key)

    engine = ExpansionEngine(graph, llm)

    # Expand node
    new_nodes = engine.expand_node(start.id)

    print("Created nodes:")

    for n in new_nodes:
        print("-", n.title)

    print("\nSerialized graph:\n")
    print(json.dumps(graph.to_dict(), indent=2))