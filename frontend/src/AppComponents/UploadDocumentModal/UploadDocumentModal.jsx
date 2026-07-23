import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  uploadDocument,
} from "../../api/upload_document";

import "./UploadDocumentModal.css";


const ACCEPTED_FILE_TYPES = [
  ".pdf",
  ".docx",
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".xml",
  ".html",
  ".htm",
].join(",");


const MAX_FILE_SIZE_BYTES =
  20 * 1024 * 1024;


export default function UploadDocumentModal({
  open,
  caseId,
  nodeId,
  nodes = [],
  lockNodeSelection = false,
  onClose,
  onUploaded,
}) {
  const fileInputRef = useRef(null);

  const [
    selectedNodeId,
    setSelectedNodeId,
  ] = useState(nodeId || "");

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] =
    useState(false);
  const [error, setError] = useState("");


  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedNodeId(nodeId || "");
    setSelectedFile(null);
    setTitle("");
    setError("");
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [open, nodeId]);


  const selectedNode = useMemo(
    () =>
      nodes.find(
        (node) =>
          node.id === selectedNodeId,
      ),
    [nodes, selectedNodeId],
  );


  if (!open) {
    return null;
  }


  const handleFileChange = (event) => {
    const file =
      event.target.files?.[0] || null;

    setError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);

      setError(
        "The selected document exceeds the 20 MB size limit.",
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    if (!title.trim()) {
      setTitle(
        removeFileExtension(file.name),
      );
    }
  };


  const openFilePicker = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };


  const removeSelectedFile = () => {
    if (isUploading) {
      return;
    }

    setSelectedFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!caseId) {
      setError(
        "No case is currently selected.",
      );
      return;
    }

    if (!selectedNodeId) {
      setError(
        "Please select a case step.",
      );
      return;
    }

    if (!selectedFile) {
      setError(
        "Please select a document.",
      );
      return;
    }

    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setError(
        "Please enter a document title.",
      );
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const artifact =
        await uploadDocument({
          caseId,
          nodeId: selectedNodeId,
          file: selectedFile,
          title: normalizedTitle,
        });

      await onUploaded?.(artifact);

      onClose();
    } catch (uploadError) {
      console.error(uploadError);

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Document upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  };


  const handleOverlayClick = () => {
    if (!isUploading) {
      onClose();
    }
  };


  return (
    <div
      className="upload-document-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="upload-document-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-document-title"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          className="upload-document-modal-close"
          type="button"
          onClick={onClose}
          disabled={isUploading}
          aria-label="Close upload dialog"
        >
          ×
        </button>

        <div className="upload-document-modal-header">
          <div className="upload-document-modal-icon">
            <UploadIcon />
          </div>

          <div>
            <p className="upload-document-modal-eyebrow">
              Case documents
            </p>

            <h2 id="upload-document-title">
              Upload document
            </h2>

            <p>
              Select a document and attach it to
              the appropriate case step. The file
              format and content are processed by
              the backend.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="upload-document-modal-content">
            <div className="upload-document-form-group">
              <label
                className="upload-document-form-label"
                htmlFor="upload-document-node"
              >
                Case step
              </label>

              <div className="upload-document-select-wrapper">
                <select
                  id="upload-document-node"
                  className="upload-document-form-select"
                  value={selectedNodeId}
                  disabled={
                    lockNodeSelection ||
                    isUploading
                  }
                  onChange={(event) => {
                    setSelectedNodeId(
                      event.target.value,
                    );
                    setError("");
                  }}
                  required
                >
                  <option value="">
                    Select a case step
                  </option>

                  {nodes.map((node) => (
                    <option
                      key={node.id}
                      value={node.id}
                    >
                      {getNodeLabel(node)}
                    </option>
                  ))}
                </select>

                <ChevronDownIcon />
              </div>

              {lockNodeSelection &&
                selectedNode && (
                  <span className="upload-document-form-help">
                    This document will be
                    attached to the currently
                    selected case step.
                  </span>
                )}
            </div>

            <div className="upload-document-form-group">
              <label
                className="upload-document-form-label"
                htmlFor="upload-document-title-input"
              >
                Document title
              </label>

              <input
                id="upload-document-title-input"
                className="upload-document-form-input"
                type="text"
                value={title}
                disabled={isUploading}
                placeholder="For example: Employment contract"
                onChange={(event) => {
                  setTitle(
                    event.target.value,
                  );
                  setError("");
                }}
                required
              />

              <span className="upload-document-form-help">
                The filename is used
                automatically when you select a
                document.
              </span>
            </div>

            <div className="upload-document-form-group">
              <label
                className="upload-document-form-label"
                htmlFor="upload-document-file"
              >
                Document file
              </label>

              <input
                ref={fileInputRef}
                id="upload-document-file"
                className="upload-document-hidden-file-input"
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                disabled={isUploading}
                onChange={handleFileChange}
              />

              {!selectedFile ? (
                <button
                  type="button"
                  className="upload-document-file-picker"
                  onClick={openFilePicker}
                  disabled={isUploading}
                >
                  <span className="upload-document-file-picker-icon">
                    <DocumentUploadIcon />
                  </span>

                  <span className="upload-document-file-picker-text">
                    <strong>
                      Select a document
                    </strong>

                    <span>
                      PDF, DOCX, TXT,
                      Markdown, JSON, XML or
                      HTML. Maximum size:
                      20 MB.
                    </span>
                  </span>

                  <span className="upload-document-file-picker-action">
                    Browse
                  </span>
                </button>
              ) : (
                <div className="upload-document-selected-file">
                  <div className="upload-document-selected-file-icon">
                    <DocumentIcon />
                  </div>

                  <div className="upload-document-selected-file-info">
                    <strong>
                      {selectedFile.name}
                    </strong>

                    <span>
                      {formatFileSize(
                        selectedFile.size,
                      )}
                      {" · "}
                      Parsing occurs after
                      upload
                    </span>
                  </div>

                  <button
                    type="button"
                    className="upload-document-remove-file-button"
                    onClick={
                      removeSelectedFile
                    }
                    disabled={isUploading}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div
                className="upload-document-validation-error"
                role="alert"
              >
                <ErrorIcon />

                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="upload-document-modal-footer">
            <button
              type="button"
              className="upload-document-cancel-button"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="upload-document-submit-button"
              disabled={
                isUploading ||
                !selectedFile ||
                !selectedNodeId ||
                !title.trim()
              }
            >
              {isUploading ? (
                <>
                  <span className="upload-document-button-spinner" />
                  Uploading and parsing…
                </>
              ) : (
                <>
                  <UploadButtonIcon />
                  Upload document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function removeFileExtension(filename) {
  const lastDotIndex =
    filename.lastIndexOf(".");

  if (lastDotIndex <= 0) {
    return filename;
  }

  return filename.slice(0, lastDotIndex);
}


function formatFileSize(sizeBytes) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} bytes`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(
      sizeBytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    sizeBytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}


function getNodeLabel(node) {
  return (
    node.data?.label ||
    node.label ||
    node.title ||
    node.id
  );
}


function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="M7.5 8.5 12 4l4.5 4.5" />
      <path d="M5 14v5h14v-5" />
    </svg>
  );
}


function DocumentUploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 3h8l4 4v14H6Z" />
      <path d="M14 3v5h5" />
      <path d="M12 17v-6" />
      <path d="m9.5 13.5 2.5-2.5 2.5 2.5" />
    </svg>
  );
}


function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 3h8l4 4v14H6Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}


function ChevronDownIcon() {
  return (
    <svg
      className="upload-document-select-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m7 9 5 5 5-5" />
    </svg>
  );
}


function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}


function UploadButtonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 16V5" />
      <path d="m8 9 4-4 4 4" />
      <path d="M5 15v4h14v-4" />
    </svg>
  );
}