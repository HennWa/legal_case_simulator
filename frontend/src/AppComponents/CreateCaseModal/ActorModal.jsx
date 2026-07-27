import { useEffect, useState } from "react";

import "./ActorModal.css";


const DEFAULT_NEGOTIATION_PROFILE = {
  cooperativeness: 50,
  assertiveness: 50,
  trust_in_opponent: 50,
  flexibility: 50,
  emotionality: 50,
};


const EMPTY_ACTOR = {
  name: "",
  role: "",
  goal: "",
  gender: "",
  date_of_birth: "",
  nationality: "",
  profession: "",
  background: "",
  negotiation_profile: null,
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


const NEGOTIATION_FIELDS = [
  {
    key: "cooperativeness",
    label: "Cooperativeness",
    lowLabel: "Self-interested",
    highLabel: "Collaborative",
    description:
      "Willingness to collaborate and seek mutually beneficial solutions.",
  },
  {
    key: "assertiveness",
    label: "Assertiveness",
    lowLabel: "Yielding",
    highLabel: "Determined",
    description:
      "Strength with which the actor pursues and defends their own interests.",
  },
  {
    key: "trust_in_opponent",
    label: "Trust in opponent",
    lowLabel: "Distrustful",
    highLabel: "Trusting",
    description:
      "The actor's level of trust in the opposing party and its intentions.",
  },
  {
    key: "flexibility",
    label: "Flexibility",
    lowLabel: "Inflexible",
    highLabel: "Adaptable",
    description:
      "Willingness to change positions, consider alternatives, or make concessions.",
  },
  {
    key: "emotionality",
    label: "Emotionality",
    lowLabel: "Detached",
    highLabel: "Emotional",
    description:
      "Degree to which emotions influence the actor's decisions and behavior.",
  },
];


function normalizeNegotiationProfile(profile) {
  if (!profile) {
    return null;
  }

  return {
    cooperativeness:
      profile.cooperativeness ??
      DEFAULT_NEGOTIATION_PROFILE.cooperativeness,

    assertiveness:
      profile.assertiveness ??
      DEFAULT_NEGOTIATION_PROFILE.assertiveness,

    trust_in_opponent:
      profile.trust_in_opponent ??
      DEFAULT_NEGOTIATION_PROFILE.trust_in_opponent,

    flexibility:
      profile.flexibility ??
      DEFAULT_NEGOTIATION_PROFILE.flexibility,

    emotionality:
      profile.emotionality ??
      DEFAULT_NEGOTIATION_PROFILE.emotionality,
  };
}


function normalizeActor(actor) {
  if (!actor) {
    return {
      ...EMPTY_ACTOR,
    };
  }

  return {
    ...EMPTY_ACTOR,
    ...actor,
    negotiation_profile:
      normalizeNegotiationProfile(
        actor.negotiation_profile,
      ),
  };
}


export default function ActorModal({
  open,
  actor = null,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    ...EMPTY_ACTOR,
  });

  const [
    validationError,
    setValidationError,
  ] = useState("");


  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(normalizeActor(actor));
    setValidationError("");
  }, [actor, open]);


  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEsc,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEsc,
      );
    };
  }, [open, onClose]);


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

    setValidationError("");
  };


  const updateNegotiationProfile = (
    field,
    value,
  ) => {
    const numericValue = Number(value);

    setForm((previousForm) => ({
      ...previousForm,

      negotiation_profile: {
        ...DEFAULT_NEGOTIATION_PROFILE,
        ...(previousForm.negotiation_profile ??
          {}),
        [field]: numericValue,
      },
    }));

    setValidationError("");
  };


  const handleProfileApplicabilityChange = (
    applicable,
  ) => {
    setForm((previousForm) => ({
      ...previousForm,

      negotiation_profile: applicable
        ? {
            ...DEFAULT_NEGOTIATION_PROFILE,
            ...(previousForm.negotiation_profile ??
              {}),
          }
        : null,
    }));
  };


  const validateActor = () => {
    if (!form.name.trim()) {
      return "Please enter the actor's name.";
    }

    if (!form.role.trim()) {
      return "Please enter the actor's role.";
    }

    if (!form.goal.trim()) {
      return "Please enter the actor's goal.";
    }

    return "";
  };


  const handleSave = () => {
    const error = validateActor();

    if (error) {
      setValidationError(error);
      return;
    }

    onSave({
      ...form,

      name: form.name.trim(),
      role: form.role.trim(),
      goal: form.goal.trim(),

      gender:
        form.gender.trim() || null,

      date_of_birth:
        form.date_of_birth.trim() || null,

      nationality:
        form.nationality.trim() || null,

      profession:
        form.profession.trim() || null,

      background:
        form.background.trim() || null,

      negotiation_profile:
        form.negotiation_profile
          ? {
              cooperativeness:
                Number(
                  form.negotiation_profile
                    .cooperativeness,
                ),

              assertiveness:
                Number(
                  form.negotiation_profile
                    .assertiveness,
                ),

              trust_in_opponent:
                Number(
                  form.negotiation_profile
                    .trust_in_opponent,
                ),

              flexibility:
                Number(
                  form.negotiation_profile
                    .flexibility,
                ),

              emotionality:
                Number(
                  form.negotiation_profile
                    .emotionality,
                ),
            }
          : null,
    });
  };


  const profileApplicable =
    form.negotiation_profile !== null;


  return (
    <div
      className="actor-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="actor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="actor-modal-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="actor-modal-header">
          <div>
            <span className="actor-modal-eyebrow">
              Case participant
            </span>

            <h2
              id="actor-modal-title"
              className="actor-modal-title"
            >
              {actor
                ? "Edit Actor"
                : "Add Actor"}
            </h2>

            <p className="actor-modal-subtitle">
              Add the actor's identity, legal
              objective, and optional negotiation
              characteristics.
            </p>
          </div>

          <button
            className="actor-modal-close"
            type="button"
            aria-label="Close actor dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>


        <div className="actor-modal-body">
          <section className="actor-form-section">
            <div className="actor-section-heading">
              <div>
                <h3>General information</h3>

                <p>
                  Basic information identifying the
                  actor and their role in the case.
                </p>
              </div>
            </div>


            <div className="actor-form-row">
              <div className="actor-form-group">
                <label
                  className="actor-form-label"
                  htmlFor="actor-name"
                >
                  Name
                  <span
                    className="actor-required-marker"
                    aria-hidden="true"
                  >
                    *
                  </span>
                </label>

                <input
                  id="actor-name"
                  className="actor-form-input"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(event) =>
                    update(
                      "name",
                      event.target.value,
                    )
                  }
                />
              </div>


              <div className="actor-form-group">
                <label
                  className="actor-form-label"
                  htmlFor="actor-role"
                >
                  Role
                  <span
                    className="actor-required-marker"
                    aria-hidden="true"
                  >
                    *
                  </span>
                </label>

                <input
                  id="actor-role"
                  className="actor-form-input"
                  type="text"
                  placeholder="Plaintiff, employer, court..."
                  value={form.role}
                  onChange={(event) =>
                    update(
                      "role",
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>


            <div className="actor-form-group">
              <label
                className="actor-form-label"
                htmlFor="actor-goal"
              >
                Goal
                <span
                  className="actor-required-marker"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>

              <textarea
                id="actor-goal"
                className="actor-form-textarea actor-goal-textarea"
                placeholder="For example: Receive the highest possible severance payment and terminate the employment relationship."
                value={form.goal}
                onChange={(event) =>
                  update(
                    "goal",
                    event.target.value,
                  )
                }
              />

              <div className="actor-form-help">
                Describe the actor's desired final
                outcome in this legal case.
              </div>
            </div>


            <div className="actor-form-row">
              <div className="actor-form-group">
                <label
                  className="actor-form-label"
                  htmlFor="actor-gender"
                >
                  Gender
                </label>

                <select
                  id="actor-gender"
                  className="actor-form-select"
                  value={form.gender ?? ""}
                  onChange={(event) =>
                    update(
                      "gender",
                      event.target.value,
                    )
                  }
                >
                  {GENDERS.map((gender) => (
                    <option
                      key={gender}
                      value={gender}
                    >
                      {gender || "Not specified"}
                    </option>
                  ))}
                </select>
              </div>


              <div className="actor-form-group">
                <label
                  className="actor-form-label"
                  htmlFor="actor-date-of-birth"
                >
                  Date of birth
                </label>

                <input
                  id="actor-date-of-birth"
                  className="actor-form-input"
                  type="date"
                  value={
                    form.date_of_birth ?? ""
                  }
                  onChange={(event) =>
                    update(
                      "date_of_birth",
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>


            <div className="actor-form-row">
              <div className="actor-form-group">
                <label
                  className="actor-form-label"
                  htmlFor="actor-nationality"
                >
                  Nationality
                </label>

                <select
                  id="actor-nationality"
                  className="actor-form-select"
                  value={
                    form.nationality ?? ""
                  }
                  onChange={(event) =>
                    update(
                      "nationality",
                      event.target.value,
                    )
                  }
                >
                  {NATIONALITIES.map(
                    (country) => (
                      <option
                        key={country}
                        value={country}
                      >
                        {country ||
                          "Not specified"}
                      </option>
                    ),
                  )}
                </select>
              </div>


              <div className="actor-form-group">
                <label
                  className="actor-form-label"
                  htmlFor="actor-profession"
                >
                  Profession
                </label>

                <input
                  id="actor-profession"
                  className="actor-form-input"
                  type="text"
                  placeholder="Lawyer, engineer..."
                  value={
                    form.profession ?? ""
                  }
                  onChange={(event) =>
                    update(
                      "profession",
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>


            <div className="actor-form-group">
              <label
                className="actor-form-label"
                htmlFor="actor-background"
              >
                Background
              </label>

              <textarea
                id="actor-background"
                className="actor-form-textarea"
                placeholder="Provide relevant background information..."
                value={form.background ?? ""}
                onChange={(event) =>
                  update(
                    "background",
                    event.target.value,
                  )
                }
              />

              <div className="actor-form-help">
                Optional facts that may become
                relevant during legal reasoning.
              </div>
            </div>
          </section>


          <section className="actor-form-section actor-profile-section">
            <div className="actor-section-heading actor-profile-heading">
              <div>
                <h3>Negotiation profile</h3>

                <p>
                  Optional behavioural characteristics
                  used when simulating decisions and
                  negotiations.
                </p>
              </div>

              <div
                className="actor-profile-applicability"
                role="group"
                aria-label="Negotiation profile applicability"
              >
                <button
                  className={`actor-applicability-button ${
                    !profileApplicable
                      ? "is-active"
                      : ""
                  }`}
                  type="button"
                  onClick={() =>
                    handleProfileApplicabilityChange(
                      false,
                    )
                  }
                >
                  Not applicable
                </button>

                <button
                  className={`actor-applicability-button ${
                    profileApplicable
                      ? "is-active"
                      : ""
                  }`}
                  type="button"
                  onClick={() =>
                    handleProfileApplicabilityChange(
                      true,
                    )
                  }
                >
                  Applicable
                </button>
              </div>
            </div>


            {!profileApplicable ? (
              <div className="actor-profile-empty-state">
                <div className="actor-profile-empty-icon">
                  —
                </div>

                <div>
                  <strong>
                    No negotiation profile
                  </strong>

                  <p>
                    This is suitable for courts,
                    authorities, administrative bodies,
                    or other actors for whom personal
                    negotiation behaviour is not
                    applicable.
                  </p>
                </div>
              </div>
            ) : (
              <div className="actor-slider-list">
                {NEGOTIATION_FIELDS.map(
                  (field) => {
                    const value =
                      form.negotiation_profile?.[
                        field.key
                      ] ??
                      DEFAULT_NEGOTIATION_PROFILE[
                        field.key
                      ];

                    return (
                      <div
                        className="actor-slider-card"
                        key={field.key}
                      >
                        <div className="actor-slider-header">
                          <div>
                            <label
                              className="actor-slider-label"
                              htmlFor={`actor-${field.key}`}
                            >
                              {field.label}
                            </label>

                            <p className="actor-slider-description">
                              {field.description}
                            </p>
                          </div>

                          <output
                            className="actor-slider-value"
                            htmlFor={`actor-${field.key}`}
                          >
                            {value}
                          </output>
                        </div>

                        <input
                          id={`actor-${field.key}`}
                          className="actor-range-input"
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={value}
                          onChange={(event) =>
                            updateNegotiationProfile(
                              field.key,
                              event.target.value,
                            )
                          }
                        />

                        <div className="actor-slider-scale">
                          <span>
                            {field.lowLabel}
                          </span>

                          <span>50</span>

                          <span>
                            {field.highLabel}
                          </span>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </section>


          {validationError && (
            <div
              className="actor-validation-error"
              role="alert"
            >
              {validationError}
            </div>
          )}
        </div>


        <div className="actor-modal-actions">
          <button
            className="actor-button actor-button-secondary"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="actor-button actor-button-primary"
            type="button"
            onClick={handleSave}
          >
            Save Actor
          </button>
        </div>
      </div>
    </div>
  );
}