import { useEffect, useState } from "react";
import "./ActorModal.css";

const EMPTY_ACTOR = {
  name: "",
  role: "",
  gender: "",
  date_of_birth: "",
  nationality: "",
  profession: "",
  background: "",
};

const GENDERS = [
  "",
  "Male",
  "Female",
  "Diverse",
  "Unknown",
];

const NATIONALITIES = [
  "",
  "Germany",
  "Austria",
  "Switzerland",
  "United Kingdom",
  "United States",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Belgium",
  "Poland",
  "Other",
];

export default function ActorModal({
  open,
  actor = null,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_ACTOR);

  useEffect(() => {
    if (actor) {
      setForm({
        ...EMPTY_ACTOR,
        ...actor,
      });
    } else {
      setForm(EMPTY_ACTOR);
    }
  }, [actor, open]);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);

    return () =>
      document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave({
      ...form,
    });
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="actor-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="modal-title">
          {actor ? "Edit Actor" : "Add Actor"}
        </h2>

        <div className="form-group">
          <label className="form-label">
            Name
          </label>

          <input
            className="form-input"
            type="text"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) =>
              update("name", e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Role
          </label>

          <input
            className="form-input"
            type="text"
            placeholder="Plaintiff, Employer, Witness..."
            value={form.role}
            onChange={(e) =>
              update("role", e.target.value)
            }
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Gender
            </label>

            <select
              className="form-select"
              value={form.gender}
              onChange={(e) =>
                update("gender", e.target.value)
              }
            >
              {GENDERS.map((g) => (
                <option
                  key={g}
                  value={g}
                >
                  {g || "Not specified"}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Date of Birth
            </label>

            <input
              className="form-input"
              type="date"
              value={form.date_of_birth}
              onChange={(e) =>
                update(
                  "date_of_birth",
                  e.target.value
                )
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Nationality
            </label>

            <select
              className="form-select"
              value={form.nationality}
              onChange={(e) =>
                update(
                  "nationality",
                  e.target.value
                )
              }
            >
              {NATIONALITIES.map((country) => (
                <option
                  key={country}
                  value={country}
                >
                  {country || "Not specified"}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Profession
            </label>

            <input
              className="form-input"
              type="text"
              placeholder="Lawyer, Engineer..."
              value={form.profession}
              onChange={(e) =>
                update(
                  "profession",
                  e.target.value
                )
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Background
          </label>

          <textarea
            className="form-textarea"
            placeholder="Provide any relevant background information..."
            value={form.background}
            onChange={(e) =>
              update(
                "background",
                e.target.value
              )
            }
          />

          <div className="form-help">
            Optional information that may become
            relevant during legal reasoning.
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="button button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="button button-primary"
            onClick={handleSave}
          >
            Save Actor
          </button>
        </div>
      </div>
    </div>
  );
}