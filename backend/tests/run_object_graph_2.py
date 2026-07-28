import os
from dotenv import load_dotenv

from backend.object_graph_runtime.graph_classes import (CaseGraph, LegalState, Actor, ActorStatus, LegalNode,
                                                        Case, utc_now, NegotiationProfile)
from backend.expansion_engine.exapnsion_engine import ExpansionEngine
from backend.llm_interface.llm_interface import MockLLMProvider
from backend.database.repositories.graph_repository import GraphRepository
from backend.database.repositories.artifact_repository import ArtifactRepository
from backend.database.repositories.edge_repository import EdgeRepository
from backend.database.repositories.case_repository import CaseRepository
from backend.database.repositories.node_repository import NodeRepository
from backend.utils.utils import get_frontend_dir
import json


if __name__ == "__main__":

    print("Start creating new graph")
    load_dotenv(override=True)
    openai_api_key = os.getenv('OPENAI_API_KEY')


    #--------------------------------- 0. Clear DB ----------------------------
    edge_repo = EdgeRepository()
    node_repo = NodeRepository()
    artifact_repo = ArtifactRepository()
    case_repo = CaseRepository()

    cases = case_repo.get_by_owner_id('111')

    for case in cases:
        print(f'db for case {case.id} cleaned')
        edge_repo.delete_by_case(case.id)
        artifact_repo.delete_by_case(case.id)
        node_repo.delete_by_case(case.id)
        case_repo.delete(case.id)


    # -------------------------------- 1. case --------------------------------

    graph = CaseGraph()

    default_negotiation_profile = NegotiationProfile(cooperativeness=50,
                                                     assertiveness=50,
                                                     trust_in_opponent=50,
                                                     flexibility=50,
                                                     emotionality=50,
                                                     current_goal_satisfaction=50,
                                                     )

    tim = Actor(id = '123', case_id = '7777', name='tim', role='plaintiff', goal='To collect debts',
                has_legal_expenses_insurance = True,)
    andi = Actor(id='1234', case_id = '7777', name='andi', role='debtor', goal='Not to pay')

    graph.actors =  {'tim' : tim, 'andi' : andi}
    graph.case = Case(
        id='7777',
        owner_id = '111',
        title='my_case',
        created_at=utc_now()
    )

    status_tim = ActorStatus(actor=tim,
                             income=[],
                             expenses=[],
                             intermediate_goal="",
                             negotiation_profile=default_negotiation_profile,
    )
    status_andi = ActorStatus(actor=andi,
                              income=[],
                              expenses=[],
                             intermediate_goal="",
                             negotiation_profile=default_negotiation_profile,
                             )

    state = LegalState(
        start_time= '2026-04-19T13:00:00',
        end_time='2026-04-27T13:00:00',
        legal_issue="Debtor has not paid the invoice after a reminder was sent.",
        description="Debtor has not paid the invoice after a reminder was sent.",
        final_state=False,
        actors_status=[status_tim, status_andi],
        legal_references=[],
        artifact_ids=[],
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
    repo = GraphRepository()
    print('save node to mongo db')
    repo.save_graph(graph)
    print('read node from mongo db')
    loaded = repo.load_graph('7777')

    print(type(loaded))

    print(loaded)


    #-------------------------------- 2. case --------------------------------


    graph2 = CaseGraph()

    sebo = Actor(id = '2543353', case_id = '555', name='sebo', role='thief', goal='No punishment')
    georg = Actor(id='3767', case_id = '555', name='georg', role='car owner', goal='Wants his car back')

    graph2.actors =  {'sebo' : sebo, 'georg' : georg}
    graph2.case = Case(
        id='555',
        owner_id = '111',
        title='thief_case',
        created_at=utc_now()
    )

    status_sebo = ActorStatus(actor=sebo,
                              income=[],
                              expenses=[],
                             intermediate_goal="",
                            negotiation_profile=default_negotiation_profile,
    )
    status_georg = ActorStatus(actor=georg,
                             income=[],
                             expenses=[],
                             intermediate_goal="",
                             negotiation_profile=default_negotiation_profile,
                             )

    state2 = LegalState(
        start_time= '2026-04-19T13:00:00',
        end_time='2026-04-27T13:00:00',
        legal_issue="car theft",
        description="Georg has stolen the car of Sebo",
        final_state=False,
        actors_status=[status_sebo, status_georg],
        legal_references=[],
        artifact_ids=[],
        deadlines=[]
    )

    init_node2 = LegalNode(
        id ='26537373758',
        case_id=graph2.case.id,
        incoming=[],
        outgoing=[],
        title='Car theft',
        state=state2,
        summary='Georg has stolen the car of Sebo',
    )


    # Initial node
    start2 = graph2.add_node_obj(init_node2)

    # Expansion engine
    llm = MockLLMProvider(key=openai_api_key)

    engine = ExpansionEngine(graph2, llm)

    # Expand node
    print("Creating new node")
    branch_node = engine.expand_node(start2.id)

    print("Created node")


    # Test Mongo DB
    repo = GraphRepository()
    print('save node to mongo db')
    repo.save_graph(graph2)
    print('read node from mongo db')
    loaded = repo.load_graph('555')




