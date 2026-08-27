type ApiFetch = (
  path: string,
  options?: RequestInit,
) => Promise<Response>;


export async function fetchSidebarStats(
  apiFetch: ApiFetch,
  caseId: string,
  nodeId: string,
) {
  const response = await apiFetch(
    "/sidebar_stats",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        case_id: caseId,
        node_id: nodeId,
      }),
    },
  );

  return response.json();
}