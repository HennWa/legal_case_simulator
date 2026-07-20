import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./UploadDocumentModal.css";

const EMPTY_FORM = {
  title: "",
  type: "",
  nodeId: "",
};

export default function UploadDocumentModal({
  open,
  nodes = [],
  onClose,
  onUpload,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const selectableNodes = useMemo(() => {
    if (!Array.isArray(nodes)) {
      return [];
    }

    return [...nodes].sort((firstNode, secondNode) => {
      const firstNumber = firstNode?.number ?? "";
      const secondNumber = secondNode?.number ?? "";

      return String(firstNumber).localeCompare(
        String(secondNumber),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        },
      );
    });
  }, [nodes]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setValidationError("");
    setIsSubmitting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, isSubmitting, onClose]);

  if (!open) {
    return null;
  }

  const updateForm = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    if (validationError) {
      setValidationError("");
    }
  };

  const openFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;

    setSelectedFile(file);

    if (file && !form.title.trim()) {
      setForm((currentForm) => ({
        ...currentForm,
        title: removeFileExtension(file.name),
      }));
    }

    if (validationError) {
      setValidationError("");
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Please enter a document title.";
    }

    if (!form.type.trim()) {
      return "Please enter a document type.";
    }

    if (!form.nodeId) {
      return "Please select the graph state to which the document belongs.";
    }

    if (!selectedFile) {
      return "Please select a document to upload.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const error = validateForm();

    if (error) {
      setValidationError(error);
      return;
    }

    const selectedNode =
      selectableNodes.find(
        (node) => node.id === form.nodeId,
      ) ?? null;

    const uploadData = {
      title: form.title.trim(),
      type: form.type.trim(),
      nodeId: form.nodeId,
      node: selectedNode,
      file: selectedFile,
    };

    try {
      setIsSubmitting(true);
      setValidationError("");

      await onUpload(uploadData);

      onClose();
    } catch (error) {
      console.error(
        "Failed to upload document:",
        error,
      );

      setValidationError(
        error instanceof Error
          ? error.message
          : "The document could not be uploaded.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="upload-document-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSubmitting
        ) {
          onClose();
        }
      }}
    >
      <form
        className="upload-document-modal"
        onSubmit={handleSubmit}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <button
          type="button"
          className="upload-document-modal-close"
          aria-label="Close upload dialog"
          onClick={onClose}
          disabled={isSubmitting}
        >
          ×
        </button>

        <header className="upload-document-modal-header">
          <div className="upload-document-modal-icon">
            <UploadIcon />
          </div>

          <div>
            <p className="upload-document-modal-eyebrow">
              Artifact lifecycle
            </p>

            <h2>Upload document</h2>

            <p>
              Add a source document and assign it to the
              legal state in which it becomes relevant.
            </p>
          </div>
        </header>

        <div className="upload-document-modal-content">
          <div className="upload-document-form-group">
            <label
              className="upload-document-form-label"
              htmlFor="upload-document-title"
            >
              Title
            </label>

            <input
              id="upload-document-title"
              className="upload-document-form-input"
              type="text"
              placeholder="e.g. Employment contract"
              value={form.title}
              onChange={(event) =>
                updateForm(
                  "title",
                  event.target.value,
                )
              }
              autoFocus
              disabled={isSubmitting}
            />

            <span className="upload-document-form-help">
              Use a short title by which the document can
              be identified throughout the case.
            </span>
          </div>

          <div className="upload-document-form-group">
            <label
              className="upload-document-form-label"
              htmlFor="upload-document-type"
            >
              Type
            </label>

            <input
              id="upload-document-type"
              className="upload-document-form-input"
              type="text"
              placeholder="Email, contract, letter, court filing..."
              value={form.type}
              onChange={(event) =>
                updateForm(
                  "type",
                  event.target.value,
                )
              }
              disabled={isSubmitting}
            />

            <span className="upload-document-form-help">
              Describe the functional document type. This
              can later be used for filtering and artifact
              processing.
            </span>
          </div>

          <div className="upload-document-form-group">
            <label
              className="upload-document-form-label"
              htmlFor="upload-document-node"
            >
              Related state
            </label>

            <div className="upload-document-select-wrapper">
              <select
                id="upload-document-node"
                className="upload-document-form-select"
                value={form.nodeId}
                onChange={(event) =>
                  updateForm(
                    "nodeId",
                    event.target.value,
                  )
                }
                disabled={
                  isSubmitting ||
                  selectableNodes.length === 0
                }
              >
                <option value="">
                  {selectableNodes.length === 0
                    ? "No graph states available"
                    : "Select a state"}
                </option>

                {selectableNodes.map((node) => (
                  <option
                    key={node.id}
                    value={node.id}
                  >
                    {formatNodeLabel(node)}
                  </option>
                ))}
              </select>

              <ChevronDownIcon />
            </div>

            <span className="upload-document-form-help">
              Select the state at which this document was
              received, created or became legally relevant.
            </span>
          </div>

          <div className="upload-document-form-group">
            <span className="upload-document-form-label">
              Source file
            </span>

            <input
              ref={fileInputRef}
              className="upload-document-hidden-file-input"
              type="file"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />

            {selectedFile ? (
              <div className="upload-document-selected-file">
                <div className="upload-document-selected-file-icon">
                  <FileIcon />
                </div>

                <div className="upload-document-selected-file-info">
                  <strong title={selectedFile.name}>
                    {selectedFile.name}
                  </strong>

                  <span>
                    {formatFileSize(selectedFile.size)}
                    {selectedFile.type
                      ? ` · ${selectedFile.type}`
                      : ""}
                  </span>
                </div>

                <button
                  type="button"
                  className="upload-document-remove-file-button"
                  onClick={removeSelectedFile}
                  disabled={isSubmitting}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="upload-document-file-picker"
                onClick={openFileBrowser}
                disabled={isSubmitting}
              >
                <span className="upload-document-file-picker-icon">
                  <UploadIcon />
                </span>

                <span className="upload-document-file-picker-text">
                  <strong>Choose a document</strong>
                  <span>
                    Open the browser file selector
                  </span>
                </span>

                <span className="upload-document-file-picker-action">
                  Browse
                </span>
              </button>
            )}
          </div>

          {validationError && (
            <div
              className="upload-document-validation-error"
              role="alert"
            >
              <WarningIcon />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        <footer className="upload-document-modal-footer">
          <button
            type="button"
            className="upload-document-cancel-button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="upload-document-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="upload-document-button-spinner" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon />
                Upload document
              </>
            )}
          </button>
        </footer>
      </form>
    </div>
  );
}

function formatNodeLabel(node) {
  const number = node?.number
    ? `State ${node.number}`
    : "State";

  const title =
    node?.legal_title?.trim() ||
    node?.title?.trim() ||
    "Untitled state";

  return `${number} — ${title}`;
}

function removeFileExtension(filename) {
  const lastDotIndex = filename.lastIndexOf(".");

  if (lastDotIndex <= 0) {
    return filename;
  }

  return filename.slice(0, lastDotIndex);
}

function formatFileSize(sizeInBytes) {
  if (!Number.isFinite(sizeInBytes)) {
    return "";
  }

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  const sizeInKilobytes = sizeInBytes / 1024;

  if (sizeInKilobytes < 1024) {
    return `${sizeInKilobytes.toFixed(1)} KB`;
  }

  const sizeInMegabytes =
    sizeInKilobytes / 1024;

  return `${sizeInMegabytes.toFixed(1)} MB`;
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="M7 9L12 4L17 9" />
      <path d="M5 20H19" />
    </svg>
  );
}

function FileIcon() {
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

function ChevronDownIcon() {
  return (
    <svg
      className="upload-document-select-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 9L12 14L17 9" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 3L21 20H3Z" />
      <path d="M12 9V14" />
      <path d="M12 17.5V17.6" />
    </svg>
  );
}