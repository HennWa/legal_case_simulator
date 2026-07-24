import {
  CreateCasePayload,
  CreateCaseResponse,
} from "../types/case";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8000/api";


interface ApiErrorResponse {
  detail?: string;
}


export async function createCase(
  payload: CreateCasePayload,
): Promise<CreateCaseResponse> {
  const response = await fetch(
    `${API_BASE_URL}/create_case`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    let message = "Failed to create case.";

    try {
      const errorData =
        (await response.json()) as ApiErrorResponse;

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // The backend did not return a JSON error body.
    }

    throw new Error(message);
  }

  return (
    await response.json()
  ) as CreateCaseResponse;
}