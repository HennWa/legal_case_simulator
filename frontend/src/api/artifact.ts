const API_BASE_URL = "http://localhost:8000/api";

export async function fetchArtifact(artifactId) {
  const response = await fetch(
    `${API_BASE_URL}/artifacts/${artifactId}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch artifact '${artifactId}'`
    );
  }

  return response.json();
}

export async function fetchArtifacts(artifactIds) {
  if (!artifactIds?.length) {
    return [];
  }

  const response = await fetch(
    `${API_BASE_URL}/artifacts/batch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        artifact_ids: artifactIds,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch artifacts");
  }

  return response.json();
}