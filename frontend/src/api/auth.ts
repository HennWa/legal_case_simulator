const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


export async function fetchCurrentUser(
  accessToken: string | null
) {
  const headers: HeadersInit = {};

  if (accessToken) {
    headers.Authorization =
      `Bearer ${accessToken}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    {
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch current user: ${response.status}`
    );
  }

  return response.json();
}