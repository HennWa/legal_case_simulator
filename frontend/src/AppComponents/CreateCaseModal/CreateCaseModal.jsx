import {
  useEffect,
  useMemo,
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


const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;


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


const WIZARD_STEPS = [
  {
    number: 1,
    title: "Case setup",
    shortTitle: "Setup",
    description:
      "Name the matter and choose its legal framework.",
  },
  {
    number: 2,
    title: "Actors",
    shortTitle: "Actors",
    description:
      "Add the people and institutions involved.",
  },
  {
    number: 3,
    title: "Case details",
    shortTitle: "Details",
    description:
      "Describe the facts, legal issue and relevant dates.",
  },
  {
    number: 4,
    title: "Initial documents",
    shortTitle: "Documents",
    description:
      "Attach source material to the initial case node.",
  },
];


const wizardImageModules = import.meta.glob(
  "../../assets/wizard/*.{png,jpg,jpeg,webp,svg}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);


const WIZARD_WELCOME_IMAGE =
  Object.values(wizardImageModules)[0] ?? null;


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
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
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

  const [currentStep, setCurrentStep] =
    useState(0);

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

    setCurrentStep(0);
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


  const activeStep =
    WIZARD_STEPS[currentStep];

  const progress =
    ((currentStep + 1) /
      WIZARD_STEPS.length) *
    100;

  const caseAlreadyCreated =
    Boolean(createdCaseContext);

  const editingActor =
    editingActorIndex !== null
      ? actors[editingActorIndex]
      : null;

  const submitButtonText = useMemo(() => {
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
  }, [
    caseAlreadyCreated,
    isSubmitting,
    selectedFile,
  ]);


  if (!open) {
    return null;
  }


  const update = (field, value) => {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }));

    setError("");
  };


  const handleAddActor = () => {
    if (caseAlreadyCreated) {
      return;
    }

    setEditingActorIndex(null);
    setActorModalOpen(true);
  };


  const handleEditActor = (index) => {
    if (caseAlreadyCreated) {
      return;
    }

    setEditingActorIndex(index);
    setActorModalOpen(true);
  };


  const handleDeleteActor = (index) => {
    if (caseAlreadyCreated) {
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
    setError("");
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
      setDocumentTitle(
        file.name.replace(
          /\.[^/.]+$/,
          "",
        ),
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


  const validateStep = (stepIndex) => {
    if (
      stepIndex === 0 &&
      !form.title.trim()
    ) {
      return "Please enter a title for the case.";
    }

    if (
      stepIndex === 2 &&
      !form.description.trim()
    ) {
      return "Please enter a case description.";
    }

    if (
      stepIndex === 3 &&
      selectedFile
    ) {
      if (
        selectedFile.size >
        MAX_FILE_SIZE_BYTES
      ) {
        return "The selected document is larger than 20 MB.";
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
    }

    return "";
  };


  const goToStep = (stepIndex) => {
    if (
      isSubmitting ||
      caseAlreadyCreated
    ) {
      return;
    }

    if (stepIndex > currentStep) {
      for (
        let index = currentStep;
        index < stepIndex;
        index += 1
      ) {
        const validationError =
          validateStep(index);

        if (validationError) {
          setCurrentStep(index);
          setError(validationError);
          return;
        }
      }
    }

    setError("");
    setSuccessMessage("");
    setCurrentStep(stepIndex);
  };


  const handleNext = () => {
    const validationError =
      validateStep(currentStep);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setCurrentStep((step) =>
      Math.min(
        step + 1,
        WIZARD_STEPS.length - 1,
      ),
    );
  };


  const handleBack = () => {
    if (
      isSubmitting ||
      caseAlreadyCreated
    ) {
      return;
    }

    setError("");
    setSuccessMessage("");

    setCurrentStep((step) =>
      Math.max(step - 1, 0),
    );
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

    const stepValidationError =
      validateStep(3);

    if (stepValidationError) {
      setError(stepValidationError);
      return;
    }

    if (!caseAlreadyCreated) {
      const setupError =
        validateStep(0);

      if (setupError) {
        setCurrentStep(0);
        setError(setupError);
        return;
      }

      const detailsError =
        validateStep(2);

      if (detailsError) {
        setCurrentStep(2);
        setError(detailsError);
        return;
      }
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

      if (
        createdCaseContext ||
        caseAlreadyCreated
      ) {
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


  const renderSetupStep = () => (
    <div className="wizard-welcome-layout">
      <div className="wizard-welcome-content">
        <span className="wizard-eyebrow">
          Start a new legal matter
        </span>

        <h3 className="wizard-step-heading">
          Set up your case
        </h3>

        <p className="wizard-step-copy">
          Begin with the basic information
          that identifies the case and
          determines how the simulation
          should interpret it.
        </p>

        <div className="wizard-form-stack">
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
              autoFocus
              placeholder="Lawsuit against dismissal"
              value={form.title}
              disabled={
                isSubmitting ||
                caseAlreadyCreated
              }
              onChange={(event) =>
                update(
                  "title",
                  event.target.value,
                )
              }
            />

            <span className="form-help">
              Use a short, expressive title
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
                value={form.applied_law}
                disabled={
                  isSubmitting ||
                  caseAlreadyCreated
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
                disabled={
                  isSubmitting ||
                  caseAlreadyCreated
                }
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
                      key={language.value}
                      value={language.value}
                    >
                      {language.label}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      <aside className="wizard-welcome-visual">
        <div className="wizard-visual-glow" />

        {WIZARD_WELCOME_IMAGE ? (
          <img
            className="wizard-welcome-image"
            src={WIZARD_WELCOME_IMAGE}
            alt="Create a new legal case"
          />
        ) : (
          <div className="wizard-image-placeholder">
            <span>CASE</span>
          </div>
        )}

        <div className="wizard-visual-caption">
          <strong>
            Build the case step by step
          </strong>

          <span>
            You can review and change each
            section before creating it.
          </span>
        </div>
      </aside>
    </div>
  );


  const renderActorsStep = () => (
    <div className="wizard-step-panel">
      <div className="wizard-section-header">
        <div>
          <span className="wizard-eyebrow">
            Parties and participants
          </span>

          <h3 className="wizard-step-heading">
            Who is involved?
          </h3>

          <p className="wizard-step-copy">
            Add persons, companies, courts,
            lawyers, witnesses or any other
            relevant entities.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary wizard-add-button"
          disabled={
            isSubmitting ||
            caseAlreadyCreated
          }
          onClick={handleAddActor}
        >
          <span aria-hidden="true">＋</span>
          Add Actor
        </button>
      </div>

      {actors.length === 0 ? (
        <button
          type="button"
          className="wizard-empty-state"
          disabled={
            isSubmitting ||
            caseAlreadyCreated
          }
          onClick={handleAddActor}
        >
          <span className="wizard-empty-icon">
            +
          </span>

          <strong>
            Add your first actor
          </strong>

          <span>
            Actors can be natural persons,
            companies, authorities, courts
            or other institutions.
          </span>
        </button>
      ) : (
        <div className="wizard-actor-grid">
          {actors.map(
            (actor, index) => (
              <article
                className="wizard-actor-card"
                key={`${
                  actor.name || "actor"
                }-${index}`}
              >
                <div className="wizard-actor-avatar">
                  {(actor.name || "?")
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="wizard-actor-content">
                  <strong className="wizard-actor-name">
                    {actor.name ||
                      "Unnamed actor"}
                  </strong>

                  <span className="wizard-actor-role">
                    {actor.role ||
                      "No role specified"}
                  </span>

                  {actor.goal && (
                    <p className="wizard-actor-goal">
                      {actor.goal}
                    </p>
                  )}
                </div>

                <div className="wizard-actor-actions">
                  <button
                    type="button"
                    className="wizard-icon-button"
                    aria-label={`Edit ${
                      actor.name || "actor"
                    }`}
                    disabled={
                      isSubmitting ||
                      caseAlreadyCreated
                    }
                    onClick={() =>
                      handleEditActor(index)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="wizard-icon-button wizard-icon-button-danger"
                    aria-label={`Delete ${
                      actor.name || "actor"
                    }`}
                    disabled={
                      isSubmitting ||
                      caseAlreadyCreated
                    }
                    onClick={() =>
                      handleDeleteActor(index)
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ),
          )}
        </div>
      )}

      <div className="wizard-step-note">
        <span className="wizard-note-icon">
          i
        </span>

        <span>
          Actors are optional. You can also
          add or update them later in the
          Actors view.
        </span>
      </div>
    </div>
  );


  const renderDetailsStep = () => (
    <div className="wizard-step-panel">
      <div className="wizard-section-header">
        <div>
          <span className="wizard-eyebrow">
            Facts and legal context
          </span>

          <h3 className="wizard-step-heading">
            Describe the case
          </h3>

          <p className="wizard-step-copy">
            Give the simulation enough
            context to create a meaningful
            initial legal state.
          </p>
        </div>
      </div>

      <div className="wizard-form-stack">
        <div className="form-group">
          <label
            className="form-label"
            htmlFor="case-description"
          >
            Description
          </label>

          <textarea
            id="case-description"
            className="form-textarea wizard-description"
            placeholder="Describe the facts, the current situation and what the involved parties want to achieve."
            value={form.description}
            disabled={
              isSubmitting ||
              caseAlreadyCreated
            }
            onChange={(event) =>
              update(
                "description",
                event.target.value,
              )
            }
          />

          <span className="form-help">
            Include the important events,
            current status and desired
            outcomes.
          </span>
        </div>

        <div className="form-row">
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
              value={form.legal_issue}
              disabled={
                isSubmitting ||
                caseAlreadyCreated
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
              disabled={
                isSubmitting ||
                caseAlreadyCreated
              }
              onChange={(event) =>
                update(
                  "deadlines",
                  event.target.value,
                )
              }
            />
          </div>
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
              value={form.status_date}
              disabled={
                isSubmitting ||
                caseAlreadyCreated
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
              disabled={
                isSubmitting ||
                caseAlreadyCreated
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
      </div>
    </div>
  );


  const renderDocumentsStep = () => (
    <div className="wizard-step-panel">
      <div className="wizard-section-header">
        <div>
          <span className="wizard-eyebrow">
            Supporting material
          </span>

          <h3 className="wizard-step-heading">
            Add an initial document
            <span className="optional-label">
              optional
            </span>
          </h3>

          <p className="wizard-step-copy">
            The document is uploaded only
            after the case and its initial
            node have been created.
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
              PDF, DOCX, TXT, Markdown,
              JSON, XML or HTML
            </small>
          </span>

          <span className="document-upload-action">
            Browse files
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

      <div className="wizard-review-card">
        <div className="wizard-review-heading">
          <span>Ready to create</span>
          <strong>{form.title || "Untitled case"}</strong>
        </div>

        <div className="wizard-review-grid">
          <div>
            <span>Applied law</span>
            <strong>
              {APPLIED_LAWS.find(
                (law) =>
                  law.value ===
                  form.applied_law,
              )?.label ??
                form.applied_law}
            </strong>
          </div>

          <div>
            <span>Language</span>
            <strong>
              {LANGUAGES.find(
                (language) =>
                  language.value ===
                  form.language,
              )?.label ??
                form.language}
            </strong>
          </div>

          <div>
            <span>Actors</span>
            <strong>
              {actors.length}
            </strong>
          </div>

          <div>
            <span>Document</span>
            <strong>
              {selectedFile
                ? selectedFile.name
                : "None"}
            </strong>
          </div>
        </div>
      </div>

      {caseAlreadyCreated && (
        <div className="case-created-notice">
          <strong>
            The case has already been
            created.
          </strong>

          <span>
            Only the document upload will
            be retried. No duplicate case
            will be created.
          </span>
        </div>
      )}
    </div>
  );


  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderSetupStep();
      case 1:
        return renderActorsStep();
      case 2:
        return renderDetailsStep();
      case 3:
        return renderDocumentsStep();
      default:
        return null;
    }
  };


  return (
    <>
      <div
        className="modal-overlay create-case-wizard-overlay"
        onMouseDown={
          handleOverlayClick
        }
      >
        <div
          className="create-case-modal create-case-wizard"
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

          <header className="wizard-header">
            <div className="wizard-brand">
              <span className="wizard-brand-mark">
                C
              </span>

              <div>
                <h2
                  id="create-case-title"
                  className="modal-title"
                >
                  Create new Case
                </h2>

                <p className="modal-subtitle">
                  Four clear steps to
                  initialize your legal
                  simulation.
                </p>
              </div>
            </div>

            <div className="wizard-step-counter">
              Step {currentStep + 1} of{" "}
              {WIZARD_STEPS.length}
            </div>
          </header>

          <div className="wizard-progress-track">
            <div
              className="wizard-progress-value"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="wizard-shell">
            <nav
              className="wizard-navigation"
              aria-label="Case creation steps"
            >
              {WIZARD_STEPS.map(
                (step, index) => {
                  const isActive =
                    index === currentStep;

                  const isComplete =
                    index < currentStep;

                  return (
                    <button
                      key={step.number}
                      type="button"
                      className={[
                        "wizard-nav-item",
                        isActive
                          ? "wizard-nav-item-active"
                          : "",
                        isComplete
                          ? "wizard-nav-item-complete"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={
                        isSubmitting ||
                        caseAlreadyCreated
                      }
                      aria-current={
                        isActive
                          ? "step"
                          : undefined
                      }
                      onClick={() =>
                        goToStep(index)
                      }
                    >
                      <span className="wizard-nav-number">
                        {isComplete
                          ? "✓"
                          : step.number}
                      </span>

                      <span className="wizard-nav-copy">
                        <strong>
                          {step.shortTitle}
                        </strong>

                        <small>
                          {step.description}
                        </small>
                      </span>
                    </button>
                  );
                },
              )}
            </nav>

            <main className="wizard-content">
              <div className="wizard-mobile-step-label">
                <span>
                  {activeStep.number}.
                </span>

                <strong>
                  {activeStep.title}
                </strong>
              </div>

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

              <div
                className="wizard-step-content"
                key={currentStep}
              >
                {renderCurrentStep()}
              </div>

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
            </main>
          </div>

          <footer className="modal-footer wizard-footer">
            <button
              type="button"
              className="button button-secondary"
              disabled={isSubmitting}
              onClick={
                currentStep === 0
                  ? onClose
                  : handleBack
              }
            >
              {currentStep === 0
                ? "Cancel"
                : "Back"}
            </button>

            <div className="wizard-footer-status">
              <span>
                {activeStep.title}
              </span>

              <span className="wizard-footer-dots">
                {WIZARD_STEPS.map(
                  (_, index) => (
                    <span
                      key={index}
                      className={
                        index ===
                        currentStep
                          ? "active"
                          : ""
                      }
                    />
                  ),
                )}
              </span>
            </div>

            {currentStep <
            WIZARD_STEPS.length - 1 ? (
              <button
                type="button"
                className="button button-primary"
                disabled={
                  isSubmitting ||
                  caseAlreadyCreated
                }
                onClick={handleNext}
              >
                Continue
                <span aria-hidden="true">
                  →
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="button button-primary wizard-create-button"
                disabled={isSubmitting}
                onClick={handleCreate}
              >
                {submitButtonText}
              </button>
            )}
          </footer>
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