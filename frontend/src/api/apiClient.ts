const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


type GetAccessToken =
  () => Promise<string | null>;


export class ApiRequestError
  extends Error {

  status: number;
  detail: unknown;

  constructor(
    status: number,
    message: string,
    detail: unknown = null,
  ) {
    super(message);

    this.name =
      "ApiRequestError";

    this.status =
      status;

    this.detail =
      detail;
  }
}


export function isNodeLimitReachedError(
  error: unknown,
): error is ApiRequestError {
  if (
    !(error instanceof ApiRequestError)
  ) {
    return false;
  }

  if (
    error.status !== 403
  ) {
    return false;
  }

  if (
    !error.detail ||
    typeof error.detail !==
      "object"
  ) {
    return false;
  }

  const detail =
    error.detail as {
      code?: unknown;
    };

  return (
    detail.code ===
    "node_limit_reached"
  );
}


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
      new Headers(
        options.headers
      );

    if (token) {
      headers.set(
        "Authorization",
        `Bearer ${token}`
      );
    }

    const response =
      await fetch(
        `${API_BASE_URL}${path}`,
        {
          ...options,
          headers,
        }
      );

    if (!response.ok) {
      let responseBody:
        unknown = null;

      try {
        responseBody =
          await response.json();

      } catch {
        /*
         * Response is not JSON.
         */
      }


      let detail:
        unknown = null;


      if (
        responseBody &&
        typeof responseBody ===
          "object" &&
        "detail" in responseBody
      ) {
        detail =
          (
            responseBody as {
              detail?: unknown;
            }
          ).detail;
      }


      let message =
        `API request failed: ${response.status}`;


      if (
        typeof detail ===
        "string"
      ) {
        message =
          detail;
      }

      else if (
        detail &&
        typeof detail ===
          "object" &&
        "message" in detail &&
        typeof (
          detail as {
            message?: unknown;
          }
        ).message ===
          "string"
      ) {
        message =
          (
            detail as {
              message: string;
            }
          ).message;
      }


      throw new ApiRequestError(
        response.status,
        message,
        detail,
      );
    }

    return response;
  };
}