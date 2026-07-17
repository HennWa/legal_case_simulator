export async function createArtifacts(caseId: string, edgeId: string) {
  const res = await fetch("http://localhost:8000/api/create_artifacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      case_id: caseId,
      edge_id: edgeId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create artifacts ${edgeId}`);
  }

  return res.json();
}


