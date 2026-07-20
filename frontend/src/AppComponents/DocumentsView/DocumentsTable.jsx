import { useState } from "react";

import "./DocumentsTable.css";

import {
  updateArtifactContent,
} from "../../api/artifact";


const EXTRACTED_PREVIEW_LENGTH = 360;
const CONTENT_PREVIEW_LENGTH = 600;


export default function DocumentsTable({
  artifacts,
  onArtifactsChange,
}) {
  const [
    expandedExtractedIds,
    setExpandedExtractedIds,
  ] = useState(new Set());

  const [
    editingArtifactId,
    setEditingArtifactId,
  ] = useState(null);

  const [
    draftContent,
    setDraftContent,
  ] = useState("");

  const [
    savingArtifactId,
    setSavingArtifactId,
  ] = useState(null);

  const [
    saveError,
    setSaveError,
  ] = useState(null);


  const toggleExtractedContent = (
    artifactId,
  ) => {
    setExpandedExtractedIds((current) => {
      const next = new Set(current);

      if (next.has(artifactId)) {
        next.delete(artifactId);
      } else {
        next.add(artifactId);
      }

      return next;
    });
  };


  const startEditing = (artifact) => {
    setEditingArtifactId(artifact.id);
    setDraftContent(artifact.content ?? "");
    setSaveError(null);
  };


  const cancelEditing = () => {
    setEditingArtifactId(null);
    setDraftContent("");
    setSaveError(null);
  };


  const saveArtifactContent = async (
    artifactId,
  ) => {
    if (!artifactId) {
      setSaveError(
        "The artifact cannot be saved because it has no ID.",
      );

      return;
    }

    try {
      setSavingArtifactId(artifactId);
      setSaveError(null);

      /*
       * Persist the edited content in MongoDB.
       *
       * The backend should return the complete updated
       * artifact object.
       */
      const updatedArtifact =
        await updateArtifactContent(
          artifactId,
          draftContent,
        );

      /*
       * Replace the artifact in the current frontend
       * state with the version returned by the backend.
       *
       * Returning the complete object is useful because
       * the backend may later update additional fields,
       * such as timestamp_modified or edited_by.
       */
      const updatedArtifacts = artifacts.map(
        (artifact) =>
          artifact.id === artifactId
            ? {
                ...artifact,
                ...updatedArtifact,
              }
            : artifact,
      );

      onArtifactsChange(updatedArtifacts);

      setEditingArtifactId(null);
      setDraftContent("");
    } catch (error) {
      console.error(
        "Failed to save artifact content:",
        error,
      );

      setSaveError(
        error instanceof Error
          ? error.message
          : "The artifact content could not be saved.",
      );
    } finally {
      setSavingArtifactId(null);
    }
  };


  return (
    <div className="documents-table-wrapper">
      <table className="documents-table">
        <thead>
          <tr>
            <th>Original file</th>

            <th>Extracted content</th>

            <th>Artifact content</th>

            <th>Output files</th>
          </tr>
        </thead>

        <tbody>
          {artifacts.map((artifact) => {
            const isEditing =
              editingArtifactId === artifact.id;

            const isSaving =
              savingArtifactId === artifact.id;

            const extractedContent =
              artifact.extracted_content?.trim() ??
              "";

            const artifactContent =
              artifact.content?.trim() ?? "";

            const isExtractedExpanded =
              expandedExtractedIds.has(
                artifact.id,
              );

            const outputFiles =
              artifact.output_files ?? [];

            return (
              <tr key={artifact.id}>
                <td className="documents-source-cell">
                  <SourceFileCell
                    artifact={artifact}
                  />
                </td>

                <td className="documents-extracted-cell">
                  {!extractedContent ? (
                    <EmptyCellText>
                      No extracted source content
                    </EmptyCellText>
                  ) : (
                    <div className="documents-extracted-content">
                      <p>
                        {isExtractedExpanded
                          ? extractedContent
                          : truncateText(
                              extractedContent,
                              EXTRACTED_PREVIEW_LENGTH,
                            )}
                      </p>

                      {extractedContent.length >
                        EXTRACTED_PREVIEW_LENGTH && (
                        <button
                          type="button"
                          className="documents-show-more-button"
                          onClick={() =>
                            toggleExtractedContent(
                              artifact.id,
                            )
                          }
                        >
                          {isExtractedExpanded
                            ? "Show less"
                            : "Show more"}
                        </button>
                      )}
                    </div>
                  )}
                </td>

                <td className="documents-content-cell">
                  {isEditing ? (
                    <div className="documents-editor">
                      <textarea
                        className="documents-editor-textarea"
                        value={draftContent}
                        onChange={(event) =>
                          setDraftContent(
                            event.target.value,
                          )
                        }
                        disabled={isSaving}
                        autoFocus
                      />

                      {saveError && (
                        <div
                          role="alert"
                          style={{
                            marginTop: "8px",
                            color: "#9b4d4d",
                            fontSize: "12px",
                            lineHeight: "1.4",
                          }}
                        >
                          {saveError}
                        </div>
                      )}

                      <div className="documents-editor-footer">
                        <span>
                          {draftContent.length}{" "}
                          characters
                        </span>

                        <div className="documents-editor-actions">
                          <button
                            type="button"
                            className="documents-cancel-button"
                            onClick={cancelEditing}
                            disabled={isSaving}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            className="documents-save-button"
                            onClick={() =>
                              saveArtifactContent(
                                artifact.id,
                              )
                            }
                            disabled={isSaving}
                          >
                            {isSaving
                              ? "Saving..."
                              : "Save"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="documents-artifact-content">
                      <div className="documents-artifact-heading">
                        <div>
                          <strong>
                            {artifact.title ??
                              "Untitled document"}
                          </strong>

                          <div className="documents-artifact-meta">
                            <span>
                              {formatArtifactType(
                                artifact.type,
                              )}
                            </span>

                            <span>
                              {formatSourceType(
                                artifact.source_type,
                              )}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="documents-edit-button"
                          onClick={() =>
                            startEditing(artifact)
                          }
                        >
                          Edit
                        </button>
                      </div>

                      {artifactContent ? (
                        <p className="documents-content-preview">
                          {truncateText(
                            artifactContent,
                            CONTENT_PREVIEW_LENGTH,
                          )}
                        </p>
                      ) : (
                        <EmptyCellText>
                          No artifact content
                        </EmptyCellText>
                      )}
                    </div>
                  )}
                </td>

                <td className="documents-output-cell">
                  <OutputFilesCell
                    outputFiles={outputFiles}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SourceFileCell({
  artifact,
}) {
  const filename =
    artifact.original_filename?.trim();

  const fileUrl =
    artifact.original_file_url?.trim();

  if (!filename) {
    return (
      <div className="documents-no-source">
        <span className="documents-source-type-badge">
          {formatSourceType(
            artifact.source_type,
          )}
        </span>

        <EmptyCellText>
          No uploaded source file
        </EmptyCellText>
      </div>
    );
  }

  return (
    <div className="documents-source-file">
      <div className="documents-file-icon">
        <FileIcon />
      </div>

      <div className="documents-file-info">
        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            title={filename}
          >
            {filename}
          </a>
        ) : (
          <span
            className="documents-file-name"
            title={filename}
          >
            {filename}
          </span>
        )}

        <span className="documents-source-type-badge">
          {formatSourceType(
            artifact.source_type,
          )}
        </span>
      </div>
    </div>
  );
}


function OutputFilesCell({
  outputFiles,
}) {
  if (
    !Array.isArray(outputFiles) ||
    outputFiles.length === 0
  ) {
    return (
      <EmptyCellText>
        No generated files
      </EmptyCellText>
    );
  }

  return (
    <div className="documents-output-list">
      {outputFiles.map((file, index) => {
        const filename =
          file.filename ??
          `Output ${index + 1}`;

        const fileUrl =
          file.file_url ??
          file.url;

        const fileType =
          file.file_type ??
          getFileExtension(filename);

        const key =
          file.id ??
          `${filename}-${index}`;

        if (!fileUrl) {
          return (
            <div
              key={key}
              className={
                "documents-output-item " +
                "documents-output-item-disabled"
              }
            >
              <OutputIcon />

              <span>{filename}</span>
            </div>
          );
        }

        return (
          <a
            key={key}
            className="documents-output-item"
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
          >
            <OutputIcon />

            <span className="documents-output-name">
              {filename}
            </span>

            {fileType && (
              <span className="documents-output-type">
                {String(
                  fileType,
                ).toUpperCase()}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}


function EmptyCellText({
  children,
}) {
  return (
    <span className="documents-empty-cell-text">
      {children}
    </span>
  );
}


function truncateText(
  text,
  maximumLength,
) {
  if (!text) {
    return "";
  }

  if (text.length <= maximumLength) {
    return text;
  }

  return `${text
    .slice(0, maximumLength)
    .trimEnd()}…`;
}


function formatArtifactType(type) {
  if (!type) {
    return "Document";
  }

  return capitalizeWords(type);
}


function formatSourceType(sourceType) {
  if (!sourceType) {
    return "Unknown source";
  }

  return capitalizeWords(sourceType);
}


function capitalizeWords(value) {
  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}


function getFileExtension(filename) {
  const parts = filename.split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.at(-1);
}


function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 2H14L19 7V22H6Z" />

      <path d="M14 2V7H19" />
    </svg>
  );
}


function OutputIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 3V15" />

      <path d="M7 10L12 15L17 10" />

      <path d="M5 20H19" />
    </svg>
  );
}