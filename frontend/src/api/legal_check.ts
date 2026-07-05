export async function legalCheck(caseId: string, nodeId: string) {
  const res = await fetch("http://localhost:8000/api/legal_check",{
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
    throw new Error(`Failed to check node ${nodeId}`);
  }

  return res.json();
}
