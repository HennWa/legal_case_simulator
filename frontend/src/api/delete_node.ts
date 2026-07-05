export async function deleteNode(caseId: string, nodeId: string) {
  const res = await fetch("http://localhost:8000/api/delete_node", {
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
    throw new Error(`Failed to delete node ${nodeId}`);
  }

  return res.json();
}
