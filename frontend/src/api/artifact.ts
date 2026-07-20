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

export async function fetchArtifactsByCase(
  caseId
) {
  if (!caseId) {
    return [];
  }

  const response = await fetch(
    `${API_BASE_URL}/cases/${caseId}/artifacts`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch artifacts for case '${caseId}'`
    );
  }

  return response.json();
}

export async function updateArtifactContent(
  artifactId: string,
  content: string,
) {
  const response = await fetch(
    `http://localhost:8000/api/update_artifact/${encodeURIComponent(
      artifactId,
    )}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        content,
      }),
    },
  );

  if (!response.ok) {
    let errorMessage =
      `Failed to update artifact '${artifactId}'.`;

    try {
      const errorData = await response.json();

      if (typeof errorData?.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        const validationMessages = errorData.detail
          .map((item: { msg?: string }) => item?.msg)
          .filter(Boolean);

        if (validationMessages.length > 0) {
          errorMessage = validationMessages.join(", ");
        }
      }
    } catch {
      // The response did not contain a readable
      // JSON error body.
    }

    throw new Error(errorMessage);
  }

  return response.json();
}