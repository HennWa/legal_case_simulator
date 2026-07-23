import { useEffect, useMemo, useRef, useState } from "react";

import { uploadDocument } from "../../api/upload_document";

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


const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;


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

  const [selectedNodeId, setSelectedNodeId] = useState(
    nodeId || ""
  );

  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");

  const [isUploading, setIsUploading] = useState(false);
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
    () => nodes.find(
      (node) => node.id === selectedNodeId
    ),
    [nodes, selectedNodeId],
  );


  if (!open) {
    return null;
  }


  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);

      setError(
        "The selected document exceeds the 20 MB size limit."
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    if (!title.trim()) {
      setTitle(removeFileExtension(file.name));
    }
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!caseId) {
      setError("No case is currently selected.");
      return;
    }

    if (!selectedNodeId) {
      setError("Please select a node.");
      return;
    }

    if (!selectedFile) {
      setError("Please select a document.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const artifact = await uploadDocument({
        caseId,
        nodeId: selectedNodeId,
        file: selectedFile,
        title,
      });

      await onUploaded?.(artifact);

      onClose();

    } catch (uploadError) {
      console.error(uploadError);

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Document upload failed."
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
      className="modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="upload-document-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-document-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="upload-document-title">
              Upload document
            </h2>

            <p>
              The document format and content are processed securely
              by the backend.
            </p>
          </div>

          <button
            className="modal-close-button"
            type="button"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close upload dialog"
          >
            ✕
          </button>
        </div>

        <form
          className="upload-document-form"
          onSubmit={handleSubmit}
        >
          <div className="upload-document-field">
            <label htmlFor="upload-document-node">
              Case step
            </label>

            <select
              id="upload-document-node"
              value={selectedNodeId}
              disabled={
                lockNodeSelection
                || isUploading
              }
              onChange={(event) => {
                setSelectedNodeId(event.target.value);
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

            {lockNodeSelection && selectedNode && (
              <small>
                This document will be attached to the currently
                selected case step.
              </small>
            )}
          </div>

          <div className="upload-document-field">
            <label htmlFor="upload-document-title-input">
              Document title
            </label>

            <input
              id="upload-document-title-input"
              type="text"
              value={title}
              disabled={isUploading}
              placeholder="For example: Employment contract"
              onChange={(event) => {
                setTitle(event.target.value);
                setError("");
              }}
            />
          </div>

          <div className="upload-document-field">
            <label htmlFor="upload-document-file">
              Document file
            </label>

            <input
              ref={fileInputRef}
              id="upload-document-file"
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              disabled={isUploading}
              onChange={handleFileChange}
              required
            />

            <small>
              PDF, DOCX, TXT, Markdown, JSON, XML or HTML.
              Maximum size: 20 MB.
            </small>
          </div>

          {selectedFile && (
            <div className="selected-document-summary">
              <div>
                <strong>{selectedFile.name}</strong>

                <span>
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>

              <span>
                Parsing occurs after secure upload.
              </span>
            </div>
          )}

          {error && (
            <div
              className="upload-document-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                isUploading
                || !selectedFile
                || !selectedNodeId
              }
            >
              {isUploading
                ? "Uploading and parsing…"
                : "Upload document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function removeFileExtension(filename) {
  const lastDotIndex = filename.lastIndexOf(".");

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
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    sizeBytes
    / (1024 * 1024)
  ).toFixed(1)} MB`;
}


function getNodeLabel(node) {
  return (
    node.data?.label
    || node.label
    || node.title
    || node.id
  );
}