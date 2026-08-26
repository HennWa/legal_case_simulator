import {
  CreateCasePayload,
  CreateCaseResponse,
} from "../types/case";


type ApiFetch = (
  path: string,
  options?: RequestInit,
) => Promise<Response>;


export async function createCase(
  apiFetch: ApiFetch,
  payload: CreateCasePayload,
): Promise<CreateCaseResponse> {
  const response = await apiFetch(
    "/create_case",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    },
  );

  return (
    await response.json()
  ) as CreateCaseResponse;
}