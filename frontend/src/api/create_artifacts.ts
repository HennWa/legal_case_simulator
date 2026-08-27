type ApiFetch = (
  path: string,
  options?: RequestInit,
) => Promise<Response>;


export interface CreateUploadedArtifactPayload {
  caseId: string;
  nodeId: string;
  title: string;
  type: string;
  originalFilename: string;
  extractedContent: string;
  content: string;
}


export async function createArtifact(
  apiFetch: ApiFetch,
  {
    caseId,
    nodeId,
    title,
    type,
    originalFilename,
    extractedContent,
    content,
  }: CreateUploadedArtifactPayload,
) {
  const response = await apiFetch(
    "/create_artifact",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        case_id: caseId,
        node_id: nodeId,
        title,
        type,
        original_filename:
          originalFilename,
        extracted_content:
          extractedContent,
        content,
      }),
    },
  );

  return response.json();
}


export async function createArtifacts(
  apiFetch: ApiFetch,
  caseId: string,
  edgeId: string,
) {
  const response = await apiFetch(
    "/create_artifacts",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        case_id: caseId,
        edge_id: edgeId,
      }),
    },
  );

  return response.json();
}