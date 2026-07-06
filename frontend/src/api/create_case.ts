import { CreateCasePayload } from "../types/case";

export async function createCase(
  payload: CreateCasePayload
) {
  const res = await fetch(
    "http://localhost:8000/api/create_case",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to create case with payload ${JSON.stringify(payload)}`
    );
  }

  return res.json();
}

