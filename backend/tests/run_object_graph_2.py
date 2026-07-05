import os
from dotenv import load_dotenv

from backend.object_graph_runtime.graph_classes import CaseGraph, LegalState, Actor, ActorStatus, LegalNode, Case, utc_now
from backend.expansion_engine.exapnsion_engine import ExpansionEngine
from backend.llm_interface.llm_interface import MockLLMProvider
from backend.database.repositories.node_repository import NodeRepository
from backend.database.repositories.graph_repository import GraphRepository
from backend.utils.utils import get_frontend_dir
import json


if __name__ == "__main__":

    print("Start creating new graph")
    load_dotenv(override=True)
    openai_api_key = os.getenv('OPENAI_API_KEY')

    graph = CaseGraph()


    tim = Actor(id = '123', case_id = '7777', name='tim', role='plaintiff')
    andi = Actor(id='1234', case_id = '7777', name='andi', role='debtor')

    graph.actors =  {'tim' : tim, 'andi' : andi}
    graph.case = Case(
        id='7777',
        owner_id = '111',
        title='my_case',
        created_at=utc_now()
    )

    status_tim = ActorStatus(actor=tim,
                             paid=0,
                             received=0,
    )
    status_andi = ActorStatus(actor=andi,
                             paid=0,
                             received=0,
                             )

    state = LegalState(
        start_time= '2026-04-19T13:00:00',
        end_time='2026-04-27T13:00:00',
        legal_issue="Debtor has not paid the invoice after a reminder was sent.",
        description="Debtor has not paid the invoice after a reminder was sent.",
        final_state=False,
        actors_status=[status_tim, status_andi],
        legal_references=[],
        artifacts=[],
        deadlines=[]
    )

    init_node = LegalNode(
        id ='12344',
        case_id=graph.case.id,
        incoming=[],
        outgoing=[],
        title='Debtor failed to pay',
        state=state,
        summary='Debtor failed to pay',
    )


    # Initial node
    start = graph.add_node_obj(init_node)

    # Expansion engine
    llm = MockLLMProvider(key=openai_api_key)

    engine = ExpansionEngine(graph, llm)

    # Expand node
    print("Creating new node")
    brach_node = engine.expand_node(start.id)

    print("Created node")

    graph.to_json(os.path.join(get_frontend_dir(), 'src/data/graph.json'))
    print("\nSerialized graph:\n")
    #print(json.dumps(graph.to_dict(), indent=2))


    # Test Mongo DB
    #repo = NodeRepository()
    #print('save node to mongo db')
    #repo.create(brach_node.node)
    #print('read node from mongo db')
    #loaded = repo.get(brach_node.node.id)

    repo = GraphRepository()
    print('save node to mongo db')
    repo.save_graph(graph)
    print('read node from mongo db')
    loaded = repo.load_graph('7777')



    print(type(loaded))

    print(loaded)
