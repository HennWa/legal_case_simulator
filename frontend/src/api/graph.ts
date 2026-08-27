type ApiFetch = (
  path: string,
  options?: RequestInit,
) => Promise<Response>;


export async function fetchGraph(
  apiFetch: ApiFetch,
  caseId: string,
) {
  const response = await apiFetch(
    `/graph/${caseId}`,
  );

  return response.json();
}