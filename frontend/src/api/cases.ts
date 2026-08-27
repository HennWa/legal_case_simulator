type ApiFetch = (
  path: string,
  options?: RequestInit,
) => Promise<Response>;


export async function fetchCases(
  apiFetch: ApiFetch,
) {
  const response = await apiFetch(
    "/cases",
  );

  return response.json();
}