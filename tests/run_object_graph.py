from object_graph_runtime.graph_classes import CaseGraph
import json

if __name__ == "__main__":
    graph = CaseGraph()

    # Actors
    claimant = graph.add_actor("Company A", "claimant")
    defendant = graph.add_actor("Customer B", "defendant")

    # Node 1: Initial state
    n1 = graph.add_node(
        title="Invoice Unpaid",
        state={
            "invoice_amount": 5000,
            "overdue_days": 30,
            "paid": False,
        },
        summary="Invoice is overdue and unpaid."
    )

    # Node 2: Reminder sent
    n2 = graph.add_node(
        title="Reminder Sent",
        state={
            "invoice_amount": 5000,
            "overdue_days": 40,
            "paid": False,
            "reminder_sent": True,
        },
        summary="Formal reminder has been sent to debtor."
    )

    # Node 3: Payment received
    n3 = graph.add_node(
        title="Payment Received",
        state={
            "invoice_amount": 5000,
            "paid": True,
        },
        summary="Debtor has paid the invoice."
    )

    # Node 4: Legal escalation
    n4 = graph.add_node(
        title="Legal Action Filed",
        state={
            "lawsuit_filed": True,
            "invoice_amount": 5000,
        },
        summary="Case escalated to court."
    )

    # Edges
    graph.add_edge(
        source_id=n1.id,
        target_id=n2.id,
        action_type="send_reminder",
        actor_id=claimant.id,
        probability=0.9
    )

    graph.add_edge(
        source_id=n2.id,
        target_id=n3.id,
        action_type="pay_invoice",
        actor_id=defendant.id,
        probability=0.4
    )

    graph.add_edge(
        source_id=n2.id,
        target_id=n4.id,
        action_type="file_lawsuit",
        actor_id=claimant.id,
        probability=0.3
    )

    # Export
    print(json.dumps(graph.to_dict(), indent=2))

    graph.to_json("legal_case_graph.json")