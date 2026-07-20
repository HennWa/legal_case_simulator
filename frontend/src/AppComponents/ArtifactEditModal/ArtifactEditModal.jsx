import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  updateArtifactContent,
} from "../../api/artifact";

import "./ArtifactEditModal.css";


export default function ArtifactEditModal({
  artifact,
  onClose,
  onSaved,
}) {
  const [draftContent, setDraftContent] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState(null);

  const textareaRef = useRef(null);


  useEffect(() => {
    if (!artifact) {
      setDraftContent("");
      setSaveError(null);
      setIsSaving(false);

      return;
    }

    setDraftContent(
      artifact.content ?? "",
    );

    setSaveError(null);
    setIsSaving(false);
  }, [artifact]);


  useEffect(() => {
    if (!artifact) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!isSaving) {
          onClose();
        }
      }

      if (
        event.key === "s" &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();

        if (!isSaving) {
          handleSave();
        }
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    artifact,
    isSaving,
    onClose,
    draftContent,
  ]);


  if (!artifact) {
    return null;
  }


  const originalContent =
    artifact.content ?? "";

  const hasChanges =
    draftContent !== originalContent;


  const handleOverlayClick = () => {
    if (!isSaving) {
      onClose();
    }
  };


  const handleModalClick = (event) => {
    event.stopPropagation();
  };


  async function handleSave() {
    if (!artifact?.id || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const updatedArtifact =
        await updateArtifactContent(
          artifact.id,
          draftContent,
        );

      onSaved(updatedArtifact);
    } catch (error) {
      console.error(
        "Failed to update artifact:",
        error,
      );

      setSaveError(
        error instanceof Error
          ? error.message
          : "The document could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }


  return (
    <div
      className="artifact-edit-overlay"
      onMouseDown={handleOverlayClick}
      role="presentation"
    >
      <section
        className="artifact-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="artifact-edit-title"
        onMouseDown={handleModalClick}
      >
        <header className="artifact-edit-header">
          <div className="artifact-edit-title-area">
            <div className="artifact-edit-icon">
              <EditDocumentIcon />
            </div>

            <div>
              <p className="artifact-edit-eyebrow">
                Edit document
              </p>

              <h2 id="artifact-edit-title">
                {artifact.title ??
                  "Untitled document"}
              </h2>

              <div className="artifact-edit-meta">
                <span>
                  {formatLabel(
                    artifact.type,
                    "Document",
                  )}
                </span>

                <span>
                  {formatLabel(
                    artifact.source_type,
                    "Unknown source",
                  )}
                </span>

                {artifact.original_filename && (
                  <span
                    className={
                      "artifact-edit-filename"
                    }
                    title={
                      artifact.original_filename
                    }
                  >
                    {
                      artifact.original_filename
                    }
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="artifact-edit-close-button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close document editor"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="artifact-edit-body">
          <div className="artifact-edit-label-row">
            <label htmlFor="artifact-content-editor">
              Artifact content
            </label>

            <span>
              {draftContent.length.toLocaleString()}{" "}
              characters
            </span>
          </div>

          <textarea
            ref={textareaRef}
            id="artifact-content-editor"
            className="artifact-edit-textarea"
            value={draftContent}
            onChange={(event) =>
              setDraftContent(
                event.target.value,
              )
            }
            disabled={isSaving}
            spellCheck="true"
            placeholder="Enter the document content..."
          />

          {saveError && (
            <div
              className="artifact-edit-error"
              role="alert"
            >
              <ErrorIcon />

              <div>
                <strong>
                  Document could not be saved
                </strong>

                <p>{saveError}</p>
              </div>
            </div>
          )}
        </div>

        <footer className="artifact-edit-footer">
          <div className="artifact-edit-shortcut">
            <span>Tip:</span>

            <kbd>Ctrl</kbd>

            <span>+</span>

            <kbd>S</kbd>

            <span>to save</span>
          </div>

          <div className="artifact-edit-actions">
            <button
              type="button"
              className="artifact-edit-cancel-button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="artifact-edit-save-button"
              onClick={handleSave}
              disabled={
                isSaving || !hasChanges
              }
            >
              {isSaving ? (
                <>
                  <span className="artifact-edit-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon />
                  Save changes
                </>
              )}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}


function formatLabel(
  value,
  fallback,
) {
  if (!value) {
    return fallback;
  }

  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}


function EditDocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 3H14L19 8V21H6Z" />
      <path d="M14 3V8H19" />
      <path d="M9 16.5L15.8 9.7L18.3 12.2L11.5 19H9Z" />
    </svg>
  );
}


function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 6L18 18" />
      <path d="M18 6L6 18" />
    </svg>
  );
}


function SaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 3H16L20 7V21H5Z" />
      <path d="M8 3V9H16V3" />
      <path d="M8 21V14H17V21" />
    </svg>
  );
}


function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7V13" />
      <path d="M12 17H12.01" />
    </svg>
  );
}