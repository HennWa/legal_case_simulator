export interface UploadDocumentParams {
  caseId: string;
  nodeId: string;
  file: File;
  title?: string;
  type?: string;
}


export interface UploadedArtifact {
  id: string;
  case_id: string;
  node_id: string;

  type: string;
  title: string;
  content: string;
  extracted_content: string | null;

  created_by: string | null;
  source_type: string;

  original_filename: string | null;
  original_content_type: string | null;
  original_file_size: number | null;
  original_file_url: string | null;
  document_format: string | null;

  timestamp_created: string;
  timestamp_uploaded: string | null;
}


type ApiFetch = (
  path: string,
  options?: RequestInit,
) => Promise<Response>;


export async function uploadDocument(
  apiFetch: ApiFetch,
  {
    caseId,
    nodeId,
    file,
    title,
    type,
  }: UploadDocumentParams,
): Promise<UploadedArtifact> {
  if (!caseId) {
    throw new Error(
      "A case ID is required.",
    );
  }

  if (!nodeId) {
    throw new Error(
      "A node ID is required.",
    );
  }

  if (!(file instanceof File)) {
    throw new Error(
      "A valid document file is required.",
    );
  }

  const formData = new FormData();

  formData.append(
    "case_id",
    caseId,
  );

  formData.append(
    "node_id",
    nodeId,
  );

  formData.append(
    "file",
    file,
    file.name,
  );

  if (title?.trim()) {
    formData.append(
      "title",
      title.trim(),
    );
  }

  if (type?.trim()) {
    formData.append(
      "type",
      type.trim(),
    );
  }

  const response = await apiFetch(
    "/upload_document",
    {
      method: "POST",
      body: formData,
    },
  );

  return (
    await response.json()
  ) as UploadedArtifact;
}