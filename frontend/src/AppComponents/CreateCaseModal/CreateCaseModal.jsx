import {
  useEffect,
  useRef,
  useState,
} from "react";

import ActorModal from "./ActorModal";

import { uploadDocument } from "../../api/upload_document";

import "./CreateCaseModal.css";


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


const ACCEPTED_FILE_EXTENSIONS = new Set([
  "pdf",
  "docx",
  "txt",
  "md",
  "markdown",
  "json",
  "xml",
  "html",
  "htm",
]);


const MAX_FILE_SIZE_BYTES =
  20 * 1024 * 1024;


const EMPTY_CASE = {
  owner_id: "111",
  title: "",
  applied_law: "de",
  description: "",
  legal_issue: "",
  deadlines: "",
  status_date: "",
  legal_initiation_date: "",
  language: "en",
};


const APPLIED_LAWS = [
  {
    value: "de",
    label: "German Law",
  },
  {
    value: "us",
    label: "US Law",
  },
];


const LANGUAGES = [
  {
    value: "en",
    label: "English",
  },
  {
    value: "de",
    label: "German",
  },
  {
    value: "fr",
    label: "French",
  },
];


function getFileExtension(filename) {
  const parts = filename
    .toLowerCase()
    .split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.at(-1) ?? "";
}


function formatFileSize(sizeBytes) {
  if (!Number.isFinite(sizeBytes)) {
    return "";
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
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


export default function CreateCaseModal({
  open,
  onClose,
  onCreate,
}) {
  const fileInputRef = useRef(null);

  const [form, setForm] =
    useState(EMPTY_CASE);

  const [actors, setActors] =
    useState([]);

  const [
    actorModalOpen,
    setActorModalOpen,
  ] = useState(false);

  const [
    editingActorIndex,
    setEditingActorIndex,
  ] = useState(null);

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    documentTitle,
    setDocumentTitle,
  ] = useState("");

  const [
    documentType,
    setDocumentType,
  ] = useState("document");

  const [
    createdCaseContext,
    setCreatedCaseContext,
  ] = useState(null);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    submissionStage,
    setSubmissionStage,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(EMPTY_CASE);
    setActors([]);
    setActorModalOpen(false);
    setEditingActorIndex(null);
    setSelectedFile(null);
    setDocumentTitle("");
    setDocumentType("document");
    setCreatedCaseContext(null);
    setIsSubmitting(false);
    setSubmissionStage("");
    setError("");
    setSuccessMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [open]);


  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isSubmitting) {
        return;
      }

      if (actorModalOpen) {
        setActorModalOpen(false);
        setEditingActorIndex(null);
        return;
      }

      onClose();
    };

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    open,
    actorModalOpen,
    isSubmitting,
    onClose,
  ]);


  if (!open) {
    return null;
  }


  const update = (
    field,
    value,
  ) => {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }));

    setError("");
  };


  const handleAddActor = () => {
    if (createdCaseContext) {
      return;
    }

    setEditingActorIndex(null);
    setActorModalOpen(true);
  };


  const handleEditActor = (index) => {
    if (createdCaseContext) {
      return;
    }

    setEditingActorIndex(index);
    setActorModalOpen(true);
  };


  const handleDeleteActor = (index) => {
    if (createdCaseContext) {
      return;
    }

    setActors((previousActors) =>
      previousActors.filter(
        (_, actorIndex) =>
          actorIndex !== index,
      ),
    );
  };


  const handleSaveActor = (actor) => {
    if (editingActorIndex !== null) {
      setActors((previousActors) =>
        previousActors.map(
          (
            existingActor,
            actorIndex,
          ) =>
            actorIndex ===
            editingActorIndex
              ? actor
              : existingActor,
        ),
      );
    } else {
      setActors((previousActors) => [
        ...previousActors,
        actor,
      ]);
    }

    setActorModalOpen(false);
    setEditingActorIndex(null);
  };


  const handleFileChange = (event) => {
    const file =
      event.target.files?.[0] ??
      null;

    setError("");
    setSuccessMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension =
      getFileExtension(file.name);

    if (
      !ACCEPTED_FILE_EXTENSIONS.has(
        extension,
      )
    ) {
      setSelectedFile(null);

      event.target.value = "";

      setError(
        "Unsupported document type. Please select a PDF, DOCX, text, Markdown, JSON, XML or HTML document.",
      );

      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE_BYTES
    ) {
      setSelectedFile(null);

      event.target.value = "";

      setError(
        "The selected document is larger than 20 MB.",
      );

      return;
    }

    setSelectedFile(file);

    if (!documentTitle.trim()) {
      const titleWithoutExtension =
        file.name.replace(
          /\.[^/.]+$/,
          "",
        );

      setDocumentTitle(
        titleWithoutExtension,
      );
    }
  };


  const handleRemoveFile = () => {
    setSelectedFile(null);
    setDocumentTitle("");
    setDocumentType("document");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const validateCase = () => {
    if (!form.title.trim()) {
      return "Please enter a title for the case.";
    }

    if (!form.description.trim()) {
      return "Please enter a case description.";
    }

    return "";
  };


  const validateDocument = () => {
    if (!selectedFile) {
      return "";
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE_BYTES
    ) {
      return (
        "The selected document is larger " +
        "than 20 MB."
      );
    }

    const extension =
      getFileExtension(
        selectedFile.name,
      );

    if (
      !ACCEPTED_FILE_EXTENSIONS.has(
        extension,
      )
    ) {
      return "The selected document type is not supported.";
    }

    return "";
  };


  const uploadSelectedDocument =
    async ({
      caseId,
      nodeId,
    }) => {
      if (!selectedFile) {
        return null;
      }

      setSubmissionStage(
        "Uploading and parsing document...",
      );

      return uploadDocument({
        caseId,
        nodeId,
        file: selectedFile,
        title:
          documentTitle.trim() ||
          selectedFile.name,
        type:
          documentType.trim() ||
          "document",
        createdBy: form.owner_id,
      });
    };


  const handleCreate = async () => {
    if (isSubmitting) {
      return;
    }

    setError("");
    setSuccessMessage("");

    const caseValidationError =
      createdCaseContext
        ? ""
        : validateCase();

    if (caseValidationError) {
      setError(
        caseValidationError,
      );

      return;
    }

    const documentValidationError =
      validateDocument();

    if (documentValidationError) {
      setError(
        documentValidationError,
      );

      return;
    }

    setIsSubmitting(true);

    try {
      let creationResult =
        createdCaseContext;

      if (!creationResult) {
        setSubmissionStage(
          "Creating case and initial node...",
        );

        const payload = {
          ...form,
          title: form.title.trim(),
          description:
            form.description.trim(),
          legal_issue:
            form.legal_issue.trim(),
          deadlines:
            form.deadlines.trim(),
          actors,
        };

        creationResult =
          await onCreate(payload);

        if (
          !creationResult?.case?.id ||
          !creationResult?.initial_node_id
        ) {
          throw new Error(
            "The case was created, but the backend did not return the case and initial node IDs.",
          );
        }

        setCreatedCaseContext(
          creationResult,
        );
      }

      await uploadSelectedDocument({
        caseId:
          creationResult.case.id,
        nodeId:
          creationResult.initial_node_id,
      });

      setSubmissionStage("");

      setSuccessMessage(
        selectedFile
          ? "Case and document created successfully."
          : "Case created successfully.",
      );

      onClose();
    } catch (submissionError) {
      console.error(
        submissionError,
      );

      setSubmissionStage("");

      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "The case could not be created.";

      if (createdCaseContext) {
        setError(
          `The case already exists, but the document upload failed: ${message} You can retry the document upload without creating another case.`,
        );
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleOverlayClick = () => {
    if (
      isSubmitting ||
      actorModalOpen
    ) {
      return;
    }

    onClose();
  };


  const editingActor =
    editingActorIndex !== null
      ? actors[editingActorIndex]
      : null;

  const caseAlreadyCreated =
    Boolean(createdCaseContext);

  const submitButtonText = (() => {
    if (isSubmitting) {
      return selectedFile
        ? "Creating..."
        : "Creating case...";
    }

    if (caseAlreadyCreated) {
      return "Retry document upload";
    }

    return selectedFile
      ? "Create Case & Upload"
      : "Create Case";
  })();


  return (
    <>
      <div
        className="modal-overlay"
        onMouseDown={
          handleOverlayClick
        }
      >
        <div
          className="create-case-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-case-title"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            disabled={isSubmitting}
            onClick={onClose}
          >
            ×
          </button>

          <h2
            id="create-case-title"
            className="modal-title"
          >
            Create new Case
          </h2>

          <p className="modal-subtitle">
            Provide the initial case
            information. The legal graph
            will be initialized from this
            description.
          </p>

          {caseAlreadyCreated && (
            <div className="case-created-notice">
              <strong>
                The case has already been
                created.
              </strong>

              <span>
                Only the document upload
                will be retried. No
                duplicate case will be
                created.
              </span>
            </div>
          )}

          {error && (
            <div
              className="create-case-alert create-case-alert-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {successMessage && (
            <div
              className="create-case-alert create-case-alert-success"
              role="status"
            >
              {successMessage}
            </div>
          )}

          <fieldset
            className="create-case-fieldset"
            disabled={
              isSubmitting ||
              caseAlreadyCreated
            }
          >
            <section className="case-section">
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="case-title"
                >
                  Title of Case
                </label>

                <input
                  id="case-title"
                  className="form-input"
                  type="text"
                  placeholder="Lawsuit against dismissal"
                  value={form.title}
                  onChange={(event) =>
                    update(
                      "title",
                      event.target.value,
                    )
                  }
                />

                <span className="form-help">
                  Enter an expressive title
                  for the legal matter.
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="case-law"
                  >
                    Applied Law
                  </label>

                  <select
                    id="case-law"
                    className="form-select"
                    value={
                      form.applied_law
                    }
                    onChange={(event) =>
                      update(
                        "applied_law",
                        event.target.value,
                      )
                    }
                  >
                    {APPLIED_LAWS.map(
                      (law) => (
                        <option
                          key={law.value}
                          value={law.value}
                        >
                          {law.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="case-language"
                  >
                    Language
                  </label>

                  <select
                    id="case-language"
                    className="form-select"
                    value={form.language}
                    onChange={(event) =>
                      update(
                        "language",
                        event.target.value,
                      )
                    }
                  >
                    {LANGUAGES.map(
                      (language) => (
                        <option
                          key={
                            language.value
                          }
                          value={
                            language.value
                          }
                        >
                          {language.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
            </section>

            <section className="case-section">
              <h3 className="section-title">
                Actors
              </h3>

              <p className="section-description">
                Add persons, companies,
                courts, lawyers, witnesses
                or other relevant entities.
              </p>

              <div className="actor-list">
                {actors.length === 0 ? (
                  <div className="empty-actors">
                    No actors added yet.
                  </div>
                ) : (
                  actors.map(
                    (actor, index) => (
                      <div
                        className="actor-card"
                        key={`${
                          actor.name ||
                          "actor"
                        }-${index}`}
                      >
                        <div className="actor-info">
                          <span className="actor-name">
                            {actor.name ||
                              "Unnamed actor"}
                          </span>

                          <span className="actor-role">
                            {actor.role ||
                              "No role specified"}
                          </span>
                        </div>

                        <div className="actor-actions">
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() =>
                              handleEditActor(
                                index,
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="button button-danger"
                            onClick={() =>
                              handleDeleteActor(
                                index,
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>

              <button
                type="button"
                className="button button-add-actor"
                onClick={handleAddActor}
              >
                + Add Actor
              </button>
            </section>

            <section className="case-section">
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="case-description"
                >
                  Description
                </label>

                <textarea
                  id="case-description"
                  className="form-textarea"
                  placeholder="Describe the facts, the current situation and what the involved parties want to achieve."
                  value={form.description}
                  onChange={(event) =>
                    update(
                      "description",
                      event.target.value,
                    )
                  }
                />

                <span className="form-help">
                  The more context you
                  provide, the better the
                  initial legal state can
                  be created.
                </span>
              </div>

              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="legal-issue"
                >
                  Legal Issue
                  <span className="optional-label">
                    optional
                  </span>
                </label>

                <input
                  id="legal-issue"
                  className="form-input"
                  type="text"
                  placeholder="Violation of labour law, payment dispute..."
                  value={
                    form.legal_issue
                  }
                  onChange={(event) =>
                    update(
                      "legal_issue",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="case-deadlines"
                >
                  Deadlines
                  <span className="optional-label">
                    optional
                  </span>
                </label>

                <input
                  id="case-deadlines"
                  className="form-input"
                  type="text"
                  placeholder="Response deadline until 2026-08-01"
                  value={form.deadlines}
                  onChange={(event) =>
                    update(
                      "deadlines",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="status-date"
                  >
                    Date of Status
                    <span className="optional-label">
                      optional
                    </span>
                  </label>

                  <input
                    id="status-date"
                    className="form-input"
                    type="date"
                    value={
                      form.status_date
                    }
                    onChange={(event) =>
                      update(
                        "status_date",
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="initiation-date"
                  >
                    Legal Initiation
                    <span className="optional-label">
                      optional
                    </span>
                  </label>

                  <input
                    id="initiation-date"
                    className="form-input"
                    type="date"
                    value={
                      form.legal_initiation_date
                    }
                    onChange={(event) =>
                      update(
                        "legal_initiation_date",
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </section>
          </fieldset>

          <section className="case-section document-section">
            <div className="document-section-heading">
              <div>
                <h3 className="section-title">
                  Initial Document
                  <span className="optional-label">
                    optional
                  </span>
                </h3>

                <p className="section-description">
                  The document will be
                  uploaded after the case
                  and its initial node have
                  been created.
                </p>
              </div>

              <span className="document-limit">
                Maximum 20 MB
              </span>
            </div>

            {!selectedFile ? (
              <button
                type="button"
                className="document-dropzone"
                disabled={isSubmitting}
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                <span className="document-upload-icon">
                  ↑
                </span>

                <span className="document-upload-copy">
                  <strong>
                    Select a document
                  </strong>

                  <small>
                    PDF, DOCX, TXT,
                    Markdown, JSON, XML or
                    HTML
                  </small>
                </span>
              </button>
            ) : (
              <div className="selected-document">
                <div className="selected-document-icon">
                  DOC
                </div>

                <div className="selected-document-info">
                  <strong>
                    {selectedFile.name}
                  </strong>

                  <span>
                    {formatFileSize(
                      selectedFile.size,
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  className="selected-document-remove"
                  disabled={isSubmitting}
                  onClick={handleRemoveFile}
                >
                  Remove
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              className="hidden-file-input"
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              disabled={isSubmitting}
              onChange={handleFileChange}
            />

            {selectedFile && (
              <div className="document-fields">
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="document-title"
                  >
                    Document Title
                  </label>

                  <input
                    id="document-title"
                    className="form-input"
                    type="text"
                    placeholder="Document title"
                    value={documentTitle}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      setDocumentTitle(
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="document-type"
                  >
                    Document Type
                  </label>

                  <input
                    id="document-type"
                    className="form-input"
                    type="text"
                    placeholder="document"
                    value={documentType}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      setDocumentType(
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>
            )}
          </section>

          {submissionStage && (
            <div
              className="create-case-progress"
              role="status"
            >
              <span className="create-case-spinner" />

              <span>
                {submissionStage}
              </span>
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="button button-secondary"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="button button-primary"
              disabled={isSubmitting}
              onClick={handleCreate}
            >
              {submitButtonText}
            </button>
          </div>
        </div>
      </div>

      <ActorModal
        open={actorModalOpen}
        actor={editingActor}
        onClose={() => {
          setActorModalOpen(false);
          setEditingActorIndex(null);
        }}
        onSave={handleSaveActor}
      />
    </>
  );
}