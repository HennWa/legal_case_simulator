export async function fetchSidebarStats(caseId: string, nodeId: string) {
  const res = await fetch("http://localhost:8000/api/sidebar_stats", {
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
    throw new Error(`Failed to fetch sidebar stats ${nodeId}`);
  }

  return res.json();
}
