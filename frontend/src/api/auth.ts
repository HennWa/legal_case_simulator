const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


export class CurrentUserRequestError
  extends Error {
  status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);

    this.name =
      "CurrentUserRequestError";

    this.status =
      status;
  }
}


export async function fetchCurrentUser(
  accessToken: string | null,
) {
  const headers: HeadersInit =
    {};

  if (accessToken) {
    headers.Authorization =
      `Bearer ${accessToken}`;
  }

  const response =
    await fetch(
      `${API_BASE_URL}/auth/me`,
      {
        headers,
      },
    );

  if (!response.ok) {
    let detail = "";

    try {
      const body =
        await response.json();

      if (
        typeof body?.detail ===
        "string"
      ) {
        detail =
          body.detail;
      }
    } catch {
      // Keep the fallback message.
    }

    throw new CurrentUserRequestError(
      response.status,
      detail ||
        (
          "Failed to fetch "
          + "current user."
        ),
    );
  }

  return response.json();
}