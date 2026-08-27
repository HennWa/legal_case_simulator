type ApiFetch = (
  path: string,
  options?: RequestInit,
) => Promise<Response>;


export async function legalCheck(
  apiFetch: ApiFetch,
  caseId: string,
  nodeId: string,
) {
  const response = await apiFetch(
    "/legal_check",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        case_id: caseId,
        node_id: nodeId,
      }),
    },
  );

  return response.json();
}