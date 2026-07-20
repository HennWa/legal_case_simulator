const API_BASE_URL = "http://localhost:8000/api";


export interface CreateUploadedArtifactPayload {
  caseId: string;
  nodeId: string;
  title: string;
  type: string;
  originalFilename: string;
  extractedContent: string;
  content: string;
}


export async function createArtifact({
  caseId,
  nodeId,
  title,
  type,
  originalFilename,
  extractedContent,
  content,
}: CreateUploadedArtifactPayload) {
  const response = await fetch(
    `${API_BASE_URL}/create_artifact`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        case_id: caseId,
        node_id: nodeId,
        title,
        type,
        original_filename: originalFilename,
        extracted_content: extractedContent,

        /*
         * The current backend uses payload.content
         * as created_by.
         *
         * Sending an empty value therefore keeps
         * created_by empty as intended.
         */
        content,
      }),
    },
  );

  if (!response.ok) {
    let errorMessage =
      "Failed to create the uploaded artifact.";

    try {
      const errorData = await response.json();

      if (typeof errorData?.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        errorMessage = errorData.detail
          .map((item) => item?.msg)
          .filter(Boolean)
          .join(", ");
      }
    } catch {
      // Keep the default error message when the
      // response does not contain valid JSON.
    }

    throw new Error(errorMessage);
  }

  return response.json();
}


export async function createArtifacts(
  caseId: string,
  edgeId: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/create_artifacts`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        case_id: caseId,
        edge_id: edgeId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to create artifacts for edge '${edgeId}'.`,
    );
  }

  return response.json();
}