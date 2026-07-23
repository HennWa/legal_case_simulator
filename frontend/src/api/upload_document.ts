const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8000/api";


export interface UploadDocumentParams {
  caseId: string;
  nodeId: string;
  file: File;
  title?: string;
  type?: string;
  createdBy?: string;
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


interface ApiErrorResponse {
  detail?: string;
}


export async function uploadDocument({
  caseId,
  nodeId,
  file,
  title,
  type,
  createdBy,
}: UploadDocumentParams): Promise<UploadedArtifact> {
  if (!caseId) {
    throw new Error("A case ID is required.");
  }

  if (!nodeId) {
    throw new Error("A node ID is required.");
  }

  if (!(file instanceof File)) {
    throw new Error(
      "A valid document file is required.",
    );
  }

  const formData = new FormData();

  formData.append("case_id", caseId);
  formData.append("node_id", nodeId);
  formData.append("file", file, file.name);

  if (title?.trim()) {
    formData.append("title", title.trim());
  }

  if (type?.trim()) {
    formData.append("type", type.trim());
  }

  if (createdBy?.trim()) {
    formData.append(
      "created_by",
      createdBy.trim(),
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/upload_document`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    let message = "Document upload failed.";

    try {
      const errorData =
        (await response.json()) as ApiErrorResponse;

      if (errorData.detail) {
        message = errorData.detail;
      }
    } catch {
      // The server did not return JSON.
    }

    throw new Error(message);
  }

  return (
    await response.json()
  ) as UploadedArtifact;
}