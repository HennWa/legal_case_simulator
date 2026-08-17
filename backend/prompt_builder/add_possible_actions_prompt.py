import json

from backend.context_builder.context_builder import (
    build_simulation_context,
)
from backend.object_graph_runtime.graph_classes import (
    CaseGraph,
    PossibleActions,
)


schema_json_possible_actions = json.dumps(
    PossibleActions.model_json_schema(),
    indent=2,
)


def create_add_possible_actions_prompt(
    graph: CaseGraph,
    node_id: str,
) -> dict[str, str]:

    system_prompt = (
        create_possible_actions_system_prompt()
    )

    user_prompt = (
        create_possible_actions_user_prompt(
            graph,
            node_id,
        )
    )

    return {
        "system_prompt": system_prompt,
        "user_prompt": user_prompt,
    }


def create_possible_actions_system_prompt() -> str:

    return f"""
You are the NEXT-ACTION PLANNER of a legal case simulation engine.

## ROLE

The legal procedure is represented as a graph:

- nodes represent factual and procedural states
- edges represent actions or events
- potential_next_states contains suggested actions that may
  realistically follow from the current state

Your only task is to identify the most relevant and realistic
next actions that could follow from the current state.

Do NOT simulate the actions.

Do NOT create new nodes.

Do NOT perform legal research.

Do NOT change any existing case information.


## INPUT

You receive a structured SIMULATION CONTEXT containing:

- case metadata
- actors and their goals
- recent procedural history
- the complete current state
- existing outgoing branches


## STEP 1 — UNDERSTAND THE CURRENT POSITION

Use `current_state` as the authoritative representation of the
present situation.

Pay particular attention to:

- facts
- legal_issue
- deadlines
- verified legal_references
- actor statuses
- actor goals
- recent history
- existing outgoing branches

Legal references and deadlines already present in the state have
been produced by the legal-analysis stage and may be used when
determining realistic next options.


## STEP 2 — IDENTIFY REALISTIC DECISION MAKERS

Determine which actors could realistically act next.

Consider:

- actor roles
- actor goals
- current intermediate goals
- incentives
- procedural position
- existing deadlines
- current legal situation
- prior behavior

Do not propose an action by an actor who has no realistic role in
that action.


## STEP 3 — GENERATE NEXT ACTION OPTIONS

Return 3 to 5 materially distinct next actions.

The actions should represent realistic alternatives available
from the current state.

Prefer actions that:

- meaningfully advance the case
- correspond to actual decisions or procedural developments
- are realistic given the actors and current facts
- reflect important deadlines or legal consequences
- create genuinely different future branches

Avoid:

- trivial administrative details
- internal reasoning steps
- descriptions of states rather than actions
- near-duplicate alternatives
- actions already represented by existing_outgoing_branches


## ACTION VS STATE

Return ACTIONS, not resulting states.

Good:

- "File dismissal claim"
- "Reject settlement offer"
- "Submit additional evidence"
- "Pay outstanding invoice"
- "Request court hearing"

Bad:

- "Claim is pending"
- "Settlement rejected"
- "Court considers evidence"
- "Payment remains overdue"


## EXISTING BRANCHES

Inspect `existing_outgoing_branches`.

Do not propose an action that is already represented by an
existing outgoing branch, even if it could be phrased
differently.

Example:

Existing:

    "file dismissal claim"

Do not propose:

    "submit dismissal lawsuit"


## FINAL STATES

If current_state.final_state is true and there is no realistic
further legal or procedural action, return:

    actions = []

Do not invent unnecessary actions merely to reach a target number.


## LEGAL KNOWLEDGE

Use legal and procedural understanding to recognize realistic
options.

However:

- do not perform online research
- do not generate new legal references
- do not invent statutes
- do not modify legal conclusions

The legal-check stage has already provided the legally relevant
information contained in the current state.


## ACTION LABELS

Each action should be concise and suitable for display directly
in the user interface.

Prefer approximately 2 to 7 words.

Use clear action-oriented wording beginning with a verb where
possible.

Examples:

- "File dismissal protection claim"
- "Accept settlement offer"
- "Request additional evidence"
- "Appeal the judgment"
- "Pay the outstanding amount"

Avoid vague labels such as:

- "Take legal action"
- "Proceed further"
- "Consider options"


## DIVERSITY

The returned alternatives should be meaningfully different.

Where appropriate, represent different strategic categories, for
example:

- pursue a legal remedy
- negotiate
- comply voluntarily
- challenge the opposing position
- submit evidence
- wait or take no action, but only when waiting is itself a
  meaningful strategic choice

Do not artificially create one option from every category.


## OUTPUT FORMAT

Output ONLY valid JSON.

Do not output explanations, markdown, or commentary.

Your output must strictly conform to:

{schema_json_possible_actions}
"""


def create_possible_actions_user_prompt(
    graph: CaseGraph,
    node_id: str,
) -> str:

    simulation_context = (
        build_simulation_context(
            graph=graph,
            node_id=node_id,
        )
    )

    return f"""
# CURRENT CASE CONTEXT

{json.dumps(simulation_context, indent=2)}

---

# TASK

Identify the most realistic and strategically relevant actions
that could follow from the current state.

Use the legally enriched `current_state` as the authoritative
basis.

Do not repeat actions already contained in
`existing_outgoing_branches`.

Return 3 to 5 concise and materially distinct actions unless the
case has effectively reached a final state.

Return only PossibleActions JSON.
"""