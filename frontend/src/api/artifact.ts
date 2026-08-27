type ApiFetch = (
  path: string,
  options?: RequestInit,
) => Promise<Response>;


export async function fetchArtifact(
  apiFetch: ApiFetch,
  artifactId: string,
) {
  const response = await apiFetch(
    `/artifacts/${encodeURIComponent(
      artifactId,
    )}`,
  );

  return response.json();
}


export async function fetchArtifacts(
  apiFetch: ApiFetch,
  artifactIds: string[],
) {
  if (!artifactIds?.length) {
    return [];
  }

  const response = await apiFetch(
    "/artifacts/batch",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        artifact_ids: artifactIds,
      }),
    },
  );

  return response.json();
}


export async function fetchArtifactsByCase(
  apiFetch: ApiFetch,
  caseId: string,
) {
  if (!caseId) {
    return [];
  }

  const response = await apiFetch(
    `/cases/${encodeURIComponent(
      caseId,
    )}/artifacts`,
  );

  return response.json();
}


export async function updateArtifactContent(
  apiFetch: ApiFetch,
  artifactId: string,
  content: string,
) {
  const response = await apiFetch(
    `/update_artifact/${encodeURIComponent(
      artifactId,
    )}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        content,
      }),
    },
  );

  return response.json();
}