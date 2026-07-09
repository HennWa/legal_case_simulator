export async function addNodeByAction(caseId: string, nodeId: string, action: string) {
  const res = await fetch("http://localhost:8000/api/add_node_by_action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      case_id: caseId,
      node_id: nodeId,
      action: action,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to add node ${nodeId}`);
  }

  return res.json();
}


