export async function addPossibleActions(caseId: string, nodeId: string) {
  const res = await fetch("http://localhost:8000/api/add_possible_actions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      case_id: caseId,
      node_id: nodeId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to add possible actions ${nodeId}`);
  }

  return res.json();
}


