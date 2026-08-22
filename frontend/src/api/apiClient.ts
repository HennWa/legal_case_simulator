const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


type GetAccessToken =
  () => Promise<string | null>;


export function createApiClient(
  getAccessToken: GetAccessToken
) {
  return async function apiFetch(
    path: string,
    options: RequestInit = {}
  ) {
    const token =
      await getAccessToken();

    const headers =
      new Headers(options.headers);

    if (token) {
      headers.set(
        "Authorization",
        `Bearer ${token}`
      );
    }

    const response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        headers,
      }
    );

    if (!response.ok) {
      const message =
        await response.text();

      throw new Error(
        `API request failed: ` +
        `${response.status} ${message}`
      );
    }

    return response;
  };
}