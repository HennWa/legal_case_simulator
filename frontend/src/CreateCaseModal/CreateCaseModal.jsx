import { useEffect, useState } from "react";
import "./CreateCaseModal.css";
import ActorModal from "./ActorModal";

const EMPTY_CASE = {
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
  { value: "de", label: "German Law" },
  { value: "us", label: "US Law" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
];

export default function CreateCaseModal({
  open,
  onClose,
  onCreate,
}) {
  const [form, setForm] = useState(EMPTY_CASE);
  const [actors, setActors] = useState([]);

  const [actorModalOpen, setActorModalOpen] = useState(false);
  const [editingActorIndex, setEditingActorIndex] = useState(null);

  useEffect(() => {
    if (!open) return;

    setForm(EMPTY_CASE);
    setActors([]);
    setActorModalOpen(false);
    setEditingActorIndex(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (actorModalOpen) {
          setActorModalOpen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleEsc);

    return () =>
      document.removeEventListener("keydown", handleEsc);
  }, [open, actorModalOpen, onClose]);

  if (!open) return null;

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddActor = () => {
    setEditingActorIndex(null);
    setActorModalOpen(true);
  };

  const handleEditActor = (index) => {
    setEditingActorIndex(index);
    setActorModalOpen(true);
  };

  const handleDeleteActor = (index) => {
    setActors((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const handleSaveActor = (actor) => {
    if (editingActorIndex !== null) {
      setActors((prev) =>
        prev.map((a, i) =>
          i === editingActorIndex ? actor : a
        )
      );
    } else {
      setActors((prev) => [...prev, actor]);
    }

    setActorModalOpen(false);
    setEditingActorIndex(null);
  };

  const handleCreate = async () => {
    const payload = {
      ...form,
      actors,
    };

    await onCreate(payload);
    onClose();
  };

  const editingActor =
    editingActorIndex !== null
      ? actors[editingActorIndex]
      : null;

  return (
    <>
      <div
        className="modal-overlay"
        onMouseDown={onClose}
      >
        <div
          className="create-case-modal"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>

          <h2 className="modal-title">
            Create new Case
          </h2>

          <div className="modal-subtitle">
            Provide the initial case information. The
            legal graph will be initialized from this
            description.
          </div>

          <div className="case-section">
            <div className="section-title">
              Title of Case
            </div>

            <div className="section-description">
              Enter an expressive title for your case,
              e.g. lawsuit against dismissal.
            </div>

            <input
              className="form-input"
              type="text"
              placeholder="Lawsuit against dismissal"
              value={form.title}
              onChange={(e) =>
                update("title", e.target.value)
              }
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Applied Law
              </label>

              <select
                className="form-select"
                value={form.applied_law}
                onChange={(e) =>
                  update(
                    "applied_law",
                    e.target.value
                  )
                }
              >
                {APPLIED_LAWS.map((law) => (
                  <option
                    key={law.value}
                    value={law.value}
                  >
                    {law.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Language
              </label>

              <select
                className="form-select"
                value={form.language}
                onChange={(e) =>
                  update(
                    "language",
                    e.target.value
                  )
                }
              >
                {LANGUAGES.map((lang) => (
                  <option
                    key={lang.value}
                    value={lang.value}
                  >
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="case-section">
            <div className="section-title">
              Actors
            </div>

            <div className="section-description">
              Describe all persons, companies, legal
              entities, courts, lawyers, witnesses, or
              other relevant entities.
            </div>

            {actors.length === 0 ? (
              <div className="empty-actors">
                No actors added yet.
              </div>
            ) : (
              <div className="actor-list">
                {actors.map((actor, index) => (
                  <div
                    key={`${actor.name}-${index}`}
                    className="actor-card"
                  >
                    <div className="actor-info">
                      <div className="actor-name">
                        {actor.name ||
                          "Unnamed actor"}
                      </div>

                      <div className="actor-role">
                        {actor.role ||
                          "No role specified"}
                      </div>
                    </div>

                    <div className="actor-actions">
                      <button
                        className="button button-secondary"
                        onClick={() =>
                          handleEditActor(index)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="button button-danger"
                        onClick={() =>
                          handleDeleteActor(index)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="button button-add-actor"
              onClick={handleAddActor}
            >
              + Add Actor
            </button>
          </div>

          <div className="case-section">
            <div className="section-title">
              Description
            </div>

            <div className="section-description">
              Describe your case in detail. The more
              information you provide, the better the
              agent can understand it.
            </div>

            <textarea
              className="form-textarea"
              placeholder="Describe the facts, timeline, communications, relevant documents, and current legal situation..."
              value={form.description}
              onChange={(e) =>
                update(
                  "description",
                  e.target.value
                )
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Legal Issue [optional]
            </label>

            <input
              className="form-input"
              type="text"
              placeholder="Violation of labor law, payment dispute..."
              value={form.legal_issue}
              onChange={(e) =>
                update(
                  "legal_issue",
                  e.target.value
                )
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Deadlines [optional]
            </label>

            <input
              className="form-input"
              type="text"
              placeholder="e.g. response deadline until 2026-08-01"
              value={form.deadlines}
              onChange={(e) =>
                update(
                  "deadlines",
                  e.target.value
                )
              }
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Date of Status [optional]
              </label>

              <input
                className="form-input"
                type="date"
                value={form.status_date}
                onChange={(e) =>
                  update(
                    "status_date",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Date of Legal Initiation [optional]
              </label>

              <input
                className="form-input"
                type="date"
                value={form.legal_initiation_date}
                onChange={(e) =>
                  update(
                    "legal_initiation_date",
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="button button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="button button-primary"
              onClick={handleCreate}
            >
              Create
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