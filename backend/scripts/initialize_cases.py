"""
Setzt die Casendra-Falldatenbank zurück und erstellt einen neuen
arbeitsrechtlichen Demo-Fall.

Fall:
    ACME GmbH kündigt der schwangeren Arbeitnehmerin Jennifer Kaufmann
    aus betriebsbedingten Gründen, ohne vorher eine behördliche
    Zulässigkeitserklärung einzuholen.

WARNUNG:
    Dieses Skript löscht ALLE Fälle aus der aktuell konfigurierten
    MongoDB-Datenbank, einschließlich:

    - normaler Benutzerfälle
    - Template-Fälle
    - Benutzerkopien von Templates

    Die zugehörigen Nodes, Edges, Actors und Artifacts werden ebenfalls
    über GraphRepository.delete_case() gelöscht.
"""

from dotenv import load_dotenv

# .env laden, bevor MongoDB/config importiert wird
load_dotenv(override=True)

from backend.database.mongo import db, verify_database_connection
from backend.database.repositories.graph_repository import GraphRepository
from backend.object_graph_runtime.graph_classes import (
    Actor,
    ActorStatus,
    Artifact,
    Case,
    CaseFact,
    CaseGraph,
    LegalNode,
    LegalState,
    NegotiationProfile,
    utc_now,
)


# ===========================================================================
# Case configuration
# ===========================================================================

CASE_ID = "case_acme_kuendigung"
OWNER_ID = "usr_dev_henning"
CASE_TITLE = "Demo - Kündigung während der Schwangerschaft"

JENNIFER_ID = "actor_jennifer_kaufmann"
ACME_ID = "actor_acme_gmbh"

INITIAL_NODE_ID = "node_001"

KUENDIGUNG_ARTIFACT_ID = "artifact_kuendigung_001"


# ===========================================================================
# Database reset
# ===========================================================================

def delete_all_cases() -> None:
    """
    Löscht alle Fälle aus der aktuell konfigurierten Datenbank.

    Die cases-Collection wird direkt abgefragt, damit auch Template-Fälle
    gefunden werden.

    Die eigentliche Löschung erfolgt über GraphRepository.delete_case(),
    damit auch Nodes, Edges, Actors und Artifacts des Falls gelöscht werden.
    """

    graph_repo = GraphRepository()

    case_documents = list(
        db["cases"].find(
            {},
            {
                "_id": 0,
                "id": 1,
                "title": 1,
                "is_template": 1,
            },
        )
    )

    if not case_documents:
        print("Keine bestehenden Fälle gefunden.")
        return

    print()
    print(f"Lösche {len(case_documents)} bestehende Fälle ...")

    for case_document in case_documents:
        case_id = case_document["id"]
        title = case_document.get("title", "")
        is_template = case_document.get("is_template", False)

        case_type = "Template" if is_template else "Fall"

        print(
            f"Lösche {case_type}: "
            f"{case_id} ({title})"
        )

        graph_repo.delete_case(case_id)

    print()
    print("Alle Fälle wurden gelöscht.")


# ===========================================================================
# Artifact
# ===========================================================================

def create_termination_letter() -> Artifact:
    """
    Erstellt das Kündigungsschreiben der ACME GmbH als Artifact.

    Das Artifact ist dem initialen Node zugeordnet und wurde von
    der ACME GmbH erstellt.
    """

    content = """ACME GmbH
Musterstraße 12
80331 München

Jennifer Kaufmann
Beispielstraße 24
80331 München

München, 20. März 2026

Ordentliche betriebsbedingte Kündigung

Sehr geehrte Frau Kaufmann,

hiermit kündigen wir das mit Ihnen bestehende Arbeitsverhältnis
ordentlich und fristgerecht zum 30. April 2026.

Aufgrund der derzeit angespannten wirtschaftlichen Situation unseres
Unternehmens sind wir gezwungen, unsere laufenden Kosten erheblich
zu reduzieren.

Im Rahmen der hierzu beschlossenen Restrukturierungsmaßnahmen wird
die Marketingabteilung von derzeit fünf auf künftig drei Stellen
verkleinert. Von diesem notwendigen Stellenabbau ist auch Ihre
Position als Marketing Managerin betroffen.

Wir bedauern, Ihnen keine andere Entscheidung mitteilen zu können.

Bitte geben Sie sämtliche Ihnen überlassenen Arbeitsmittel spätestens
mit Beendigung des Arbeitsverhältnisses an die ACME GmbH zurück.

Mit freundlichen Grüßen

ACME GmbH

Thomas Berger
Geschäftsführer
"""

    return Artifact(
        id=KUENDIGUNG_ARTIFACT_ID,
        case_id=CASE_ID,
        node_id=INITIAL_NODE_ID,

        type="document",

        title=(
            "Ordentliche betriebsbedingte Kündigung "
            "vom 20. März 2026"
        ),

        # Das Dokument wurde für den Demo-Fall erzeugt und nicht
        # durch einen Benutzer hochgeladen.
        source_type="generated",

        original_filename=None,
        original_file_url=None,
        extracted_content=None,

        output_files=[],

        content=content,

        # Die ACME GmbH ist Urheberin des Kündigungsschreibens.
        created_by=ACME_ID,

        timestamp_created="2026-03-20T10:00:00+00:00",
        timestamp_uploaded=None,

        original_content_type=None,
        original_file_size=None,
        document_format="txt",
    )


# ===========================================================================
# Create employment law case
# ===========================================================================

def create_default_graph() -> CaseGraph:
    """
    Erstellt den initialen arbeitsrechtlichen Fall.

    Ausgangssituation:
    Jennifer Kaufmann wird während ihrer Schwangerschaft von der
    ACME GmbH betriebsbedingt gekündigt.

    Die ACME GmbH hat vor Ausspruch der Kündigung keine behördliche
    Zulässigkeitserklärung eingeholt.
    """

    graph = CaseGraph()

    # -----------------------------------------------------------------------
    # Case
    # -----------------------------------------------------------------------

    graph.case = Case(
        id=CASE_ID,
        owner_id=OWNER_ID,
        title=CASE_TITLE,
        created_at=utc_now(),
        is_template=False,
        is_active_template=False,
        template_key=None,
        template_version=None,
    )

    # -----------------------------------------------------------------------
    # Actors
    # -----------------------------------------------------------------------

    jennifer = Actor(
        id=JENNIFER_ID,
        case_id=CASE_ID,
        name="Jennifer Kaufmann",
        role="Arbeitnehmerin",
        goal=(
            "Fortsetzung ihres Arbeitsverhältnisses bei der ACME GmbH "
            "und Abwehr der Kündigung."
        ),
        profession="Marketing Managerin",
        has_legal_expenses_insurance=True,
    )

    acme = Actor(
        id=ACME_ID,
        case_id=CASE_ID,
        name="ACME GmbH",
        role="Arbeitgeberin",
        goal=(
            "Reduzierung der Personalkosten und Verkleinerung "
            "der Marketingabteilung."
        ),
        has_legal_expenses_insurance=False,
    )

    graph.actors = {
        jennifer.id: jennifer,
        acme.id: acme,
    }

    # -----------------------------------------------------------------------
    # Negotiation profiles
    # -----------------------------------------------------------------------

    jennifer_negotiation_profile = NegotiationProfile(
        cooperativeness=50,
        assertiveness=60,
        trust_in_opponent=40,
        flexibility=40,
        emotionality=60,
        current_goal_satisfaction=20,
    )

    acme_negotiation_profile = NegotiationProfile(
        cooperativeness=40,
        assertiveness=60,
        trust_in_opponent=50,
        flexibility=50,
        emotionality=30,
        current_goal_satisfaction=40,
    )

    # -----------------------------------------------------------------------
    # Actor status
    # -----------------------------------------------------------------------

    jennifer_status = ActorStatus(
        actor=jennifer,
        income=[],
        expenses=[],
        intermediate_goal=(
            "Die ausgesprochene Kündigung abwehren."
        ),
        negotiation_profile=jennifer_negotiation_profile,
    )

    acme_status = ActorStatus(
        actor=acme,
        income=[],
        expenses=[],
        intermediate_goal=(
            "Die Marketingabteilung von fünf auf drei Stellen reduzieren."
        ),
        negotiation_profile=acme_negotiation_profile,
    )

    # -----------------------------------------------------------------------
    # Facts
    # -----------------------------------------------------------------------

    facts = [
        CaseFact(
            id="fact_001",
            description=(
                "Die ACME GmbH beschäftigt etwa 45 Arbeitnehmer."
            ),
        ),
        CaseFact(
            id="fact_002",
            description=(
                "Jennifer Kaufmann arbeitet seit vier Jahren "
                "unbefristet bei der ACME GmbH."
            ),
        ),
        CaseFact(
            id="fact_003",
            description=(
                "Jennifer Kaufmann arbeitet als Marketing Managerin."
            ),
        ),
        CaseFact(
            id="fact_004",
            description=(
                "Jennifer Kaufmann ist schwanger."
            ),
        ),
        CaseFact(
            id="fact_005",
            description=(
                "Jennifer Kaufmann informierte ihre Vorgesetzte "
                "am 3. März 2026 schriftlich über ihre Schwangerschaft."
            ),
        ),
        CaseFact(
            id="fact_006",
            description=(
                "Die ACME GmbH befindet sich in wirtschaftlichen "
                "Schwierigkeiten."
            ),
        ),
        CaseFact(
            id="fact_007",
            description=(
                "Die Geschäftsführung der ACME GmbH beschloss, "
                "Kosten zu reduzieren."
            ),
        ),
        CaseFact(
            id="fact_008",
            description=(
                "Die Marketingabteilung soll von fünf auf drei "
                "Stellen verkleinert werden."
            ),
        ),
        CaseFact(
            id="fact_009",
            description=(
                "Jennifer Kaufmann erhielt am 20. März 2026 "
                "eine ordentliche betriebsbedingte Kündigung."
            ),
        ),
        CaseFact(
            id="fact_010",
            description=(
                "Das Arbeitsverhältnis von Jennifer Kaufmann soll "
                "nach der Kündigung zum 30. April 2026 enden."
            ),
        ),
        CaseFact(
            id="fact_011",
            description=(
                "Die ACME GmbH begründet die Kündigung mit ihrer "
                "angespannten wirtschaftlichen Lage und dem notwendigen "
                "Stellenabbau."
            ),
        ),
        CaseFact(
            id="fact_012",
            description=(
                "Die ACME GmbH hat vor Ausspruch der Kündigung keine "
                "Zustimmung oder Zulässigkeitserklärung der zuständigen "
                "Behörde eingeholt."
            ),
        ),
    ]

    # -----------------------------------------------------------------------
    # Initial legal state
    # -----------------------------------------------------------------------

    initial_state = LegalState(
        start_time="2026-03-20T12:00:00",
        end_time="2026-03-20T12:00:00",

        description=(
            "Die ACME GmbH beschäftigt etwa 45 Arbeitnehmer. "
            "Jennifer Kaufmann arbeitet dort seit vier Jahren unbefristet "
            "als Marketing Managerin. "
            "Jennifer informierte ihre Vorgesetzte am 3. März 2026 "
            "schriftlich darüber, dass sie schwanger ist. "
            "Die ACME GmbH befindet sich gleichzeitig in wirtschaftlichen "
            "Schwierigkeiten. Die Geschäftsführung beschloss, Kosten zu "
            "reduzieren und die Marketingabteilung von fünf auf drei "
            "Stellen zu verkleinern. "
            "Am 20. März 2026 erhielt Jennifer eine ordentliche "
            "betriebsbedingte Kündigung zum 30. April 2026. "
            "Im Kündigungsschreiben begründet die ACME GmbH die Kündigung "
            "mit der angespannten wirtschaftlichen Lage und dem notwendigen "
            "Stellenabbau. "
            "Die ACME GmbH hat vor Ausspruch der Kündigung keine Zustimmung "
            "oder Zulässigkeitserklärung der zuständigen Behörde eingeholt."
        ),

        legal_issue=(
            "Ist die gegenüber Jennifer Kaufmann ausgesprochene "
            "betriebsbedingte Kündigung wirksam und welche rechtlichen "
            "Handlungsmöglichkeiten bestehen für die Beteiligten?"
        ),

        facts=facts,

        final_state=False,

        actors_status=[
            jennifer_status,
            acme_status,
        ],

        legal_references=[],

        # Das Kündigungsschreiben gehört zum Ausgangszustand.
        artifact_ids=[
            KUENDIGUNG_ARTIFACT_ID,
        ],

        deadlines=[],

        potential_next_states=[],
    )

    # -----------------------------------------------------------------------
    # Initial node
    # -----------------------------------------------------------------------

    initial_node = LegalNode(
        id=INITIAL_NODE_ID,
        case_id=CASE_ID,
        incoming=[],
        outgoing=[],
        title=(
            "Betriebsbedingte Kündigung während der Schwangerschaft"
        ),
        state=initial_state,
        summary=(
            "Die ACME GmbH kündigt Jennifer Kaufmann während ihrer "
            "Schwangerschaft aus betriebsbedingten Gründen. "
            "Vor Ausspruch der Kündigung wurde keine behördliche "
            "Zulässigkeitserklärung eingeholt."
        ),
    )

    graph.add_node_obj(initial_node)

    return graph


# ===========================================================================
# Main
# ===========================================================================

def main() -> None:

    print()
    print("=" * 70)
    print("Casendra - Datenbank zurücksetzen")
    print("=" * 70)

    # -----------------------------------------------------------------------
    # Check database
    # -----------------------------------------------------------------------

    print()
    print("Prüfe Datenbankverbindung ...")

    verify_database_connection()

    print("Datenbankverbindung erfolgreich.")

    # -----------------------------------------------------------------------
    # Delete existing cases
    # -----------------------------------------------------------------------

    delete_all_cases()

    # -----------------------------------------------------------------------
    # Create graph
    # -----------------------------------------------------------------------

    print()
    print("Erstelle neuen arbeitsrechtlichen Fall ...")

    graph = create_default_graph()

    # -----------------------------------------------------------------------
    # Create artifact
    # -----------------------------------------------------------------------

    termination_letter = create_termination_letter()

    # -----------------------------------------------------------------------
    # Save graph
    # -----------------------------------------------------------------------

    graph_repo = GraphRepository()

    graph_repo.save_graph(graph)

    # Wichtig:
    # save_graph() speichert aktuell nur Case, Actors, Nodes und Edges.
    # Artifacts müssen separat gespeichert werden.
    graph_repo.save_artifact(termination_letter)

    print(
        f"Fall gespeichert: "
        f"{graph.case.id} - {graph.case.title}"
    )

    print(
        f"Artifact gespeichert: "
        f"{termination_letter.id} - "
        f"{termination_letter.title}"
    )

    # -----------------------------------------------------------------------
    # Verification
    # -----------------------------------------------------------------------

    print()
    print("Lade Fall zur Kontrolle erneut aus der Datenbank ...")

    loaded_graph = graph_repo.load_graph(
        graph.case.id
    )

    if loaded_graph.case is None:
        raise RuntimeError(
            "Der neu angelegte Fall konnte nicht aus der "
            "Datenbank geladen werden."
        )

    # Artifact separat prüfen, da load_graph() Artifacts aktuell
    # ebenfalls nicht in CaseGraph lädt.
    loaded_artifact = graph_repo.artifact_repo.get(
        KUENDIGUNG_ARTIFACT_ID
    )

    if loaded_artifact is None:
        raise RuntimeError(
            "Das Kündigungsschreiben konnte nach dem Speichern "
            "nicht aus der Datenbank geladen werden."
        )

    print()
    print("Fall erfolgreich erstellt.")
    print("-" * 70)
    print(f"Case ID:     {loaded_graph.case.id}")
    print(f"Titel:       {loaded_graph.case.title}")
    print(f"Owner ID:    {loaded_graph.case.owner_id}")
    print(f"Actors:      {len(loaded_graph.actors)}")
    print(f"Nodes:       {len(loaded_graph.nodes)}")
    print(f"Edges:       {len(loaded_graph.edges)}")
    print("-" * 70)

    for actor in loaded_graph.actors.values():
        print(
            f"Actor:       {actor.name} "
            f"({actor.role})"
        )

    print("-" * 70)
    print(
        f"Artifact:    {loaded_artifact.title}"
    )
    print(
        f"Created by:  {loaded_artifact.created_by}"
    )
    print(
        f"Node:        {loaded_artifact.node_id}"
    )
    print("-" * 70)

    print()
    print("=" * 70)
    print("Reset abgeschlossen.")
    print("=" * 70)
    print()


if __name__ == "__main__":
    main()