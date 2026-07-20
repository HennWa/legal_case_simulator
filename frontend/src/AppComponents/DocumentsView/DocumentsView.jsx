import {
  useCallback,
  useEffect,
  useState,
} from "react";

import DocumentsTable from "./DocumentsTable";

import UploadDocumentModal from
  "../UploadDocumentModal/UploadDocumentModal";

import {
  fetchArtifactsByCase,
} from "../../api/artifact";

import {
  createArtifact,
} from "../../api/create_artifacts";

import {
  fetchGraph,
} from "../../api/graph";

import "./DocumentsView.css";


export default function DocumentsView({
  caseId,
}) {
  const [artifacts, setArtifacts] = useState([]);
  const [graphNodes, setGraphNodes] = useState([]);

  const [loading, setLoading] = useState(false);

  const [
    graphLoading,
    setGraphLoading,
  ] = useState(false);

  const [
    uploadModalOpen,
    setUploadModalOpen,
  ] = useState(false);

  const [error, setError] = useState(null);


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


  const refreshDocumentsView = async () => {
    await Promise.all([
      loadArtifacts(),
      loadGraphNodes(),
    ]);
  };


  const handleUploadDocument = async ({
    title,
    type,
    nodeId,
    file,
  }) => {
    if (!caseId) {
      throw new Error(
        "No case is currently selected.",
      );
    }

    if (!nodeId) {
      throw new Error(
        "Please select a related state.",
      );
    }

    if (!file) {
      throw new Error(
        "Please select a document.",
      );
    }

    const normalizedTitle = title?.trim();
    const normalizedType = type?.trim();

    if (!normalizedTitle) {
      throw new Error(
        "Please enter a document title.",
      );
    }

    if (!normalizedType) {
      throw new Error(
        "Please enter a document type.",
      );
    }

    /*
     * For now, content extraction takes place in
     * the browser.
     *
     * Later this function can be extended for PDF,
     * DOCX, email and image files, or replaced by
     * backend-side extraction after the original
     * file is uploaded.
     */
    const extractedContent =
      await extractContentFromFile(file);

    /*
     * The backend endpoint handles:
     *
     * - artifact ID generation
     * - source_type
     * - timestamps
     * - storing the artifact in MongoDB
     * - registering the artifact at the node
     * - persisting the updated node
     */
    const createdArtifact =
      await createArtifact({
        caseId,
        nodeId,
        title: normalizedTitle,
        type: normalizedType,
        originalFilename: file.name,
        extractedContent,
        content: "",
      });

    /*
     * Add the returned artifact immediately so the
     * table updates without waiting for another
     * request.
     *
     * The complete reload afterwards remains the
     * source of truth and ensures that the frontend
     * matches MongoDB.
     */
    if (createdArtifact?.id) {
      setArtifacts((currentArtifacts) => {
        const artifactAlreadyExists =
          currentArtifacts.some(
            (artifact) =>
              artifact.id === createdArtifact.id,
          );

        if (artifactAlreadyExists) {
          return currentArtifacts;
        }

        return [
          createdArtifact,
          ...currentArtifacts,
        ];
      });
    }

    /*
     * Reload the artifacts and graph because the
     * backend also changed the selected node's
     * artifact_ids.
     */
    await refreshDocumentsView();
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
              onClick={refreshDocumentsView}
              disabled={
                loading ||
                graphLoading
              }
            >
              {loading || graphLoading
                ? "Loading..."
                : "Refresh"}
            </button>

            <button
              type="button"
              className="documents-upload-button"
              onClick={openUploadModal}
              disabled={graphLoading}
            >
              + Upload document
            </button>
          </div>
        </header>

        <div className="documents-view-content">
          {loading &&
          artifacts.length === 0 ? (
            <div className="documents-view-status">
              <div className="documents-view-spinner" />

              <span>
                Loading documents...
              </span>
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

              <h2>
                No documents available
              </h2>

              <p>
                Uploaded files and documents
                generated by the application will
                appear here.
              </p>

              <button
                type="button"
                className="documents-empty-upload-button"
                onClick={openUploadModal}
                disabled={graphLoading}
              >
                Upload first document
              </button>
            </div>
          ) : (
            <DocumentsTable
              artifacts={artifacts}
              onArtifactsChange={
                setArtifacts
              }
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


/**
 * Central entry point for extracting document content.
 *
 * Additional formats can later be added here without
 * changing the artifact creation workflow.
 */
async function extractContentFromFile(file) {
  if (!(file instanceof File)) {
    throw new Error(
      "The selected document is not a valid file.",
    );
  }

  const extension =
    getFileExtension(file.name);

  switch (extension) {
    case "txt":
      return extractTextFileContent(file);

    default:
      throw new Error(
        `Unsupported file type '.${extension || "unknown"}'. ` +
          "Currently only .txt files can be uploaded.",
      );
  }
}


/**
 * Extract plain-text content while preserving line
 * breaks and other formatting.
 */
async function extractTextFileContent(file) {
  try {
    const text = await file.text();

    /*
     * Remove a possible UTF-8 byte-order mark at the
     * beginning of the file.
     */
    return text.replace(/^\uFEFF/, "");
  } catch (error) {
    console.error(
      "Failed to read the text file:",
      error,
    );

    throw new Error(
      `The content of '${file.name}' could not be read.`,
    );
  }
}


/**
 * Return the normalized extension without the dot.
 */
function getFileExtension(filename) {
  if (
    typeof filename !== "string" ||
    !filename
  ) {
    return "";
  }

  const lastDotIndex =
    filename.lastIndexOf(".");

  if (
    lastDotIndex < 0 ||
    lastDotIndex === filename.length - 1
  ) {
    return "";
  }

  return filename
    .slice(lastDotIndex + 1)
    .trim()
    .toLowerCase();
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