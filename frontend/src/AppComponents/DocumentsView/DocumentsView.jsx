import {
  useCallback,
  useEffect,
  useState,
} from "react";

import DocumentsTable from "./DocumentsTable";
import UploadDocumentModal from "../UploadDocumentModal/UploadDocumentModal";

import {
  fetchArtifactsByCase,
} from "../../api/artifact";
import { fetchGraph } from "../../api/graph";

import "./DocumentsView.css";

export default function DocumentsView({
  caseId,
}) {
  const [artifacts, setArtifacts] = useState([]);
  const [graphNodes, setGraphNodes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [graphLoading, setGraphLoading] =
    useState(false);

  const [error, setError] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] =
    useState(false);

  const loadArtifacts = useCallback(async () => {
    if (!caseId) {
      setArtifacts([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data =
        await fetchArtifactsByCase(caseId);

      setArtifacts(
        Array.isArray(data)
          ? data
          : data?.artifacts ?? [],
      );
    } catch (error) {
      console.error(
        "Failed to load artifacts:",
        error,
      );

      setArtifacts([]);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load documents.",
      );
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const loadGraphNodes = useCallback(async () => {
    if (!caseId) {
      setGraphNodes([]);
      return;
    }

    try {
      setGraphLoading(true);

      const graph = await fetchGraph(caseId);

      const nodes = graph?.nodes ?? {};

      setGraphNodes(
        Array.isArray(nodes)
          ? nodes
          : Object.values(nodes),
      );
    } catch (error) {
      console.error(
        "Failed to load graph nodes:",
        error,
      );

      setGraphNodes([]);
    } finally {
      setGraphLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadArtifacts();
    loadGraphNodes();
  }, [
    loadArtifacts,
    loadGraphNodes,
  ]);

  useEffect(() => {
    setUploadModalOpen(false);
  }, [caseId]);

  const openUploadModal = () => {
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
  };

  const handleUploadDocument = async ({
    title,
    type,
    nodeId,
    node,
    file,
  }) => {
    /*
     * Frontend lifecycle placeholder.
     *
     * Replace this section with the upload API call
     * once the backend endpoint is available.
     *
     * A multipart request will normally look like:
     *
     * const formData = new FormData();
     * formData.append("case_id", caseId);
     * formData.append("node_id", nodeId);
     * formData.append("title", title);
     * formData.append("type", type);
     * formData.append("file", file);
     *
     * const createdArtifact =
     *   await uploadArtifact(formData);
     *
     * setArtifacts((current) => [
     *   createdArtifact,
     *   ...current,
     * ]);
     */

    const temporaryFileUrl =
      URL.createObjectURL(file);

    const temporaryArtifact = {
      id: `local-upload-${Date.now()}`,
      case_id: caseId,
      node_id: nodeId,

      title,
      type,

      source_type: "uploaded_file",
      original_filename: file.name,
      original_file_url: temporaryFileUrl,

      extracted_content: "",
      content: "",
      output_files: [],

      timestamp_created:
        new Date().toISOString(),

      related_node_title:
        node?.legal_title ??
        node?.title ??
        "",
    };

    console.log(
      "Document upload payload:",
      {
        caseId,
        nodeId,
        title,
        type,
        file,
      },
    );

    setArtifacts((currentArtifacts) => [
      temporaryArtifact,
      ...currentArtifacts,
    ]);
  };

  if (!caseId) {
    return (
      <main className="documents-view">
        <div className="documents-view-status">
          <div className="documents-view-no-case">
            <DocumentIcon />

            <div>
              <h2>No case selected</h2>

              <p>
                Select a case to display its
                documents.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="documents-view">
        <header className="documents-view-header">
          <div>
            <p className="documents-view-eyebrow">
              Case documents
            </p>

            <h1>Documents</h1>

            <p className="documents-view-description">
              View uploaded source files, extracted
              text, editable artifact content and
              generated output files.
            </p>
          </div>

          <div className="documents-view-header-actions">
            <span className="documents-count">
              {artifacts.length}{" "}
              {artifacts.length === 1
                ? "document"
                : "documents"}
            </span>

            <button
              type="button"
              className="documents-refresh-button"
              onClick={() => {
                loadArtifacts();
                loadGraphNodes();
              }}
              disabled={loading || graphLoading}
            >
              {loading || graphLoading
                ? "Loading..."
                : "Refresh"}
            </button>

            <button
              type="button"
              className="documents-upload-button"
              onClick={openUploadModal}
            >
              + Upload document
            </button>
          </div>
        </header>

        <div className="documents-view-content">
          {loading && artifacts.length === 0 ? (
            <div className="documents-view-status">
              <div className="documents-view-spinner" />

              <span>Loading documents...</span>
            </div>
          ) : error ? (
            <div className="documents-view-error">
              <strong>
                Documents could not be loaded.
              </strong>

              <p>{error}</p>

              <button
                type="button"
                onClick={loadArtifacts}
              >
                Try again
              </button>
            </div>
          ) : artifacts.length === 0 ? (
            <div className="documents-view-empty">
              <div className="documents-empty-icon">
                <DocumentIcon />
              </div>

              <h2>No documents available</h2>

              <p>
                Uploaded files and documents
                generated by the application will
                appear here.
              </p>

              <button
                type="button"
                className="documents-empty-upload-button"
                onClick={openUploadModal}
              >
                Upload first document
              </button>
            </div>
          ) : (
            <DocumentsTable
              artifacts={artifacts}
              onArtifactsChange={setArtifacts}
            />
          )}
        </div>
      </main>

      <UploadDocumentModal
        open={uploadModalOpen}
        nodes={graphNodes}
        onClose={closeUploadModal}
        onUpload={handleUploadDocument}
      />
    </>
  );
}

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 2H14L19 7V22H6Z" />
      <path d="M14 2V7H19" />
      <path d="M9 12H16" />
      <path d="M9 16H16" />
    </svg>
  );
}