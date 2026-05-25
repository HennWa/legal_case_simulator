from object_graph_runtime.graph_classes import CaseGraph
from expansion_engine.exapnsion_engine import ExpansionEngine
from prompt_builder.prompt_builder import PromptBuilder
from llm_interface.llm_interface import MockLLMProvider
import json

if __name__ == "__main__":

    graph = CaseGraph()

    # Initial node
    start = graph.add_node(
        title="Invoice Overdue",
        state={
            "invoice_amount": 5000,
            "paid": False,
            "reminder_sent": True
        },
        summary="Invoice overdue after reminder."
    )

    # Expansion engine
    llm = MockLLMProvider()

    engine = ExpansionEngine(graph, llm)

    # Expand node
    new_nodes = engine.expand_node(start.id)

    print("Created nodes:")

    for n in new_nodes:
        print("-", n.title)

    print("\nSerialized graph:\n")
    print(json.dumps(graph.to_dict(), indent=2))