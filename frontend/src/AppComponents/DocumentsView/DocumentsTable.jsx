import { useState } from "react";

import ArtifactEditModal from
  "../ArtifactEditModal/ArtifactEditModal";

import "./DocumentsTable.css";


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
    editingArtifact,
    setEditingArtifact,
  ] = useState(null);


  const toggleExtractedContent = (
    artifactId,
  ) => {
    setExpandedExtractedIds(
      (current) => {
        const next = new Set(current);

        if (next.has(artifactId)) {
          next.delete(artifactId);
        } else {
          next.add(artifactId);
        }

        return next;
      },
    );
  };


  const startEditing = (artifact) => {
    setEditingArtifact(artifact);
  };


  const closeEditor = () => {
    setEditingArtifact(null);
  };


  const handleArtifactSaved = (
    updatedArtifact,
  ) => {
    const updatedArtifacts =
      artifacts.map((artifact) =>
        artifact.id ===
        updatedArtifact.id
          ? {
              ...artifact,
              ...updatedArtifact,
            }
          : artifact,
      );

    onArtifactsChange(
      updatedArtifacts,
    );

    setEditingArtifact(null);
  };


  return (
    <>
      <div className="documents-table-wrapper">
        <table className="documents-table">
          <colgroup>
            <col className="documents-column-source" />

            <col className="documents-column-extracted" />

            <col className="documents-column-content" />

            <col className="documents-column-output" />
          </colgroup>

          <thead>
            <tr>
              <th>Original file</th>

              <th>Extracted content</th>

              <th>Artifact content</th>

              <th>Output files</th>
            </tr>
          </thead>

          <tbody>
            {artifacts.map(
              (artifact) => {
                const extractedContent =
                  artifact
                    .extracted_content
                    ?.trim() ?? "";

                const artifactContent =
                  artifact.content?.trim() ??
                  "";

                const isExtractedExpanded =
                  expandedExtractedIds.has(
                    artifact.id,
                  );

                const outputFiles =
                  artifact.output_files ??
                  [];

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
                          No extracted source
                          content
                        </EmptyCellText>
                      ) : (
                        <div className="documents-text-preview">
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
                              className="documents-text-toggle"
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
                              startEditing(
                                artifact,
                              )
                            }
                          >
                            <EditIcon />

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
                    </td>

                    <td className="documents-output-cell">
                      <OutputFilesCell
                        outputFiles={
                          outputFiles
                        }
                      />
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>

      <ArtifactEditModal
        artifact={editingArtifact}
        onClose={closeEditor}
        onSaved={handleArtifactSaved}
      />
    </>
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
      {outputFiles.map(
        (file, index) => {
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
        },
      )}
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


function formatSourceType(
  sourceType,
) {
  if (!sourceType) {
    return "Unknown source";
  }

  return capitalizeWords(
    sourceType,
  );
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


function getFileExtension(
  filename,
) {
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


function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 20H8L19 9L15 5L4 16Z" />

      <path d="M13.5 6.5L17.5 10.5" />
    </svg>
  );
}