type ApiFetch = (
  path: string,
  options?: RequestInit,
) => Promise<Response>;


export async function addNodeByAction(
  apiFetch: ApiFetch,
  caseId: string,
  nodeId: string,
  action: string,
) {
  const response = await apiFetch(
    "/add_node_by_action",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        case_id: caseId,
        node_id: nodeId,
        action,
      }),
    },
  );

  return response.json();
}