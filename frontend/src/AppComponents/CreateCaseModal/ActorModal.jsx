import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  has_legal_expenses_insurance: false,
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
      "Degree to which emotions influence the actor's decisions and behaviour.",
  },
];


function normalizeText(value) {
  return typeof value === "string"
    ? value
    : "";
}


function normalizeSliderValue(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 50;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(numericValue),
    ),
  );
}


function normalizeNegotiationProfile(
  profile,
) {
  if (
    !profile ||
    typeof profile !== "object"
  ) {
    return null;
  }

  return {
    cooperativeness:
      normalizeSliderValue(
        profile.cooperativeness,
      ),

    assertiveness:
      normalizeSliderValue(
        profile.assertiveness,
      ),

    trust_in_opponent:
      normalizeSliderValue(
        profile.trust_in_opponent,
      ),

    flexibility:
      normalizeSliderValue(
        profile.flexibility,
      ),

    emotionality:
      normalizeSliderValue(
        profile.emotionality,
      ),
  };
}


function normalizeInsuranceValue(value) {
  if (value === null) {
    return null;
  }

  return value === true;
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

    name:
      normalizeText(actor.name),

    role:
      normalizeText(actor.role),

    goal:
      normalizeText(actor.goal),

    gender:
      normalizeText(actor.gender),

    date_of_birth:
      normalizeText(
        actor.date_of_birth,
      ),

    nationality:
      normalizeText(
        actor.nationality,
      ),

    profession:
      normalizeText(
        actor.profession,
      ),

    background:
      normalizeText(
        actor.background,
      ),

    has_legal_expenses_insurance:
      normalizeInsuranceValue(
        actor.has_legal_expenses_insurance,
      ),

    negotiation_profile:
      normalizeNegotiationProfile(
        actor.negotiation_profile,
      ),
  };
}


function getInsuranceOption(value) {
  if (value === null) {
    return "not_applicable";
  }

  return value
    ? "yes"
    : "no";
}


function parseInsuranceOption(value) {
  if (value === "yes") {
    return true;
  }

  if (value === "not_applicable") {
    return null;
  }

  return false;
}


export default function ActorModal({
  open,
  actor = null,
  onClose,
  onSave,
}) {
  const [form, setForm] =
    useState({
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

    setForm(
      normalizeActor(actor),
    );

    setValidationError("");
  }, [actor, open]);


  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
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
  }, [open, onClose]);


  const profileApplicable =
    form.negotiation_profile !== null;


  const insuranceOption = useMemo(
    () =>
      getInsuranceOption(
        form
          .has_legal_expenses_insurance,
      ),
    [
      form
        .has_legal_expenses_insurance,
    ],
  );


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
    setForm((previousForm) => {
      const currentProfile =
        previousForm
          .negotiation_profile ??
        DEFAULT_NEGOTIATION_PROFILE;

      return {
        ...previousForm,

        negotiation_profile: {
          ...DEFAULT_NEGOTIATION_PROFILE,
          ...currentProfile,

          [field]:
            normalizeSliderValue(
              value,
            ),
        },
      };
    });

    setValidationError("");
  };


  const handleProfileApplicabilityChange = (
    applicable,
  ) => {
    setForm((previousForm) => ({
      ...previousForm,

      negotiation_profile:
        applicable
          ? {
              ...DEFAULT_NEGOTIATION_PROFILE,
              ...(
                previousForm
                  .negotiation_profile ??
                {}
              ),
            }
          : null,
    }));

    setValidationError("");
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
    const error =
      validateActor();

    if (error) {
      setValidationError(error);
      return;
    }

    const normalizedProfile =
      form.negotiation_profile
        ? {
            cooperativeness:
              normalizeSliderValue(
                form
                  .negotiation_profile
                  .cooperativeness,
              ),

            assertiveness:
              normalizeSliderValue(
                form
                  .negotiation_profile
                  .assertiveness,
              ),

            trust_in_opponent:
              normalizeSliderValue(
                form
                  .negotiation_profile
                  .trust_in_opponent,
              ),

            flexibility:
              normalizeSliderValue(
                form
                  .negotiation_profile
                  .flexibility,
              ),

            emotionality:
              normalizeSliderValue(
                form
                  .negotiation_profile
                  .emotionality,
              ),
          }
        : null;

    onSave({
      ...actor,
      ...form,

      name:
        form.name.trim(),

      role:
        form.role.trim(),

      goal:
        form.goal.trim(),

      gender:
        form.gender.trim() ||
        null,

      date_of_birth:
        form.date_of_birth.trim() ||
        null,

      nationality:
        form.nationality.trim() ||
        null,

      profession:
        form.profession.trim() ||
        null,

      background:
        form.background.trim() ||
        null,

      has_legal_expenses_insurance:
        form
          .has_legal_expenses_insurance,

      negotiation_profile:
        normalizedProfile,
    });
  };


  const handleOverlayMouseDown = (
    event,
  ) => {
    if (
      event.target ===
      event.currentTarget
    ) {
      onClose();
    }
  };


  return (
    <div
      className="actor-modal-overlay"
      onMouseDown={
        handleOverlayMouseDown
      }
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
        <button
          className="actor-modal-close"
          type="button"
          aria-label="Close actor dialog"
          onClick={onClose}
        >
          ×
        </button>

        <header className="actor-modal-header">
          <div className="actor-modal-heading">
            <span className="actor-modal-eyebrow">
              Case participant
            </span>

            <h2 id="actor-modal-title">
              {actor
                ? "Edit Actor"
                : "Add Actor"}
            </h2>

            <p>
              Add the actor's identity,
              legal objective and optional
              negotiation characteristics.
            </p>
          </div>
        </header>

        <div className="actor-modal-body">
          <section className="actor-form-section">
            <div className="actor-section-heading">
              <span className="actor-section-number">
                01
              </span>

              <div>
                <h3>
                  General information
                </h3>

                <p>
                  Basic information
                  identifying the actor and
                  their role in the case.
                </p>
              </div>
            </div>

            <div className="actor-form-grid">
              <div className="actor-form-group">
                <label htmlFor="actor-name">
                  Name

                  <span className="actor-required">
                    *
                  </span>
                </label>

                <input
                  id="actor-name"
                  type="text"
                  autoFocus
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
                <label htmlFor="actor-role">
                  Role

                  <span className="actor-required">
                    *
                  </span>
                </label>

                <input
                  id="actor-role"
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

              <div className="actor-form-group actor-form-group-full">
                <label htmlFor="actor-goal">
                  Goal

                  <span className="actor-required">
                    *
                  </span>
                </label>

                <textarea
                  id="actor-goal"
                  rows={3}
                  placeholder="For example: Receive the highest possible severance payment and terminate the employment relationship."
                  value={form.goal}
                  onChange={(event) =>
                    update(
                      "goal",
                      event.target.value,
                    )
                  }
                />

                <span className="actor-field-help">
                  Describe the actor's
                  desired final outcome in
                  this legal case.
                </span>
              </div>
            </div>
          </section>

          <section className="actor-form-section">
            <div className="actor-section-heading">
              <span className="actor-section-number">
                02
              </span>

              <div>
                <h3>
                  Personal details
                </h3>

                <p>
                  Optional personal or
                  organisational information
                  that may be relevant to
                  the case.
                </p>
              </div>
            </div>

            <div className="actor-form-grid">
              <div className="actor-form-group">
                <label htmlFor="actor-gender">
                  Gender

                  <span className="actor-optional">
                    optional
                  </span>
                </label>

                <select
                  id="actor-gender"
                  value={form.gender}
                  onChange={(event) =>
                    update(
                      "gender",
                      event.target.value,
                    )
                  }
                >
                  {GENDERS.map(
                    (gender) => (
                      <option
                        key={
                          gender ||
                          "not-specified"
                        }
                        value={gender}
                      >
                        {gender ||
                          "Not specified"}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="actor-form-group">
                <label htmlFor="actor-date-of-birth">
                  Date of birth

                  <span className="actor-optional">
                    optional
                  </span>
                </label>

                <input
                  id="actor-date-of-birth"
                  type="date"
                  value={
                    form.date_of_birth
                  }
                  onChange={(event) =>
                    update(
                      "date_of_birth",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="actor-form-group">
                <label htmlFor="actor-nationality">
                  Nationality

                  <span className="actor-optional">
                    optional
                  </span>
                </label>

                <select
                  id="actor-nationality"
                  value={
                    form.nationality
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
                        key={
                          country ||
                          "not-specified"
                        }
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
                <label htmlFor="actor-profession">
                  Profession

                  <span className="actor-optional">
                    optional
                  </span>
                </label>

                <input
                  id="actor-profession"
                  type="text"
                  placeholder="Lawyer, engineer..."
                  value={form.profession}
                  onChange={(event) =>
                    update(
                      "profession",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="actor-form-group actor-form-group-full">
                <label htmlFor="actor-background">
                  Background

                  <span className="actor-optional">
                    optional
                  </span>
                </label>

                <textarea
                  id="actor-background"
                  rows={4}
                  placeholder="Provide relevant background information..."
                  value={form.background}
                  onChange={(event) =>
                    update(
                      "background",
                      event.target.value,
                    )
                  }
                />

                <span className="actor-field-help">
                  Optional facts that may
                  become relevant during
                  legal reasoning.
                </span>
              </div>
            </div>
          </section>

          <section className="actor-form-section">
            <div className="actor-section-heading">
              <span className="actor-section-number">
                03
              </span>

              <div>
                <h3>
                  Legal expenses insurance
                </h3>

                <p>
                  Specify whether legal
                  expenses insurance is
                  available for this actor.
                </p>
              </div>
            </div>

            <div className="actor-insurance-options">
              <label
                className={[
                  "actor-choice-card",

                  insuranceOption === "yes"
                    ? "actor-choice-card-selected"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <input
                  type="radio"
                  name="legal-expenses-insurance"
                  value="yes"
                  checked={
                    insuranceOption ===
                    "yes"
                  }
                  onChange={(event) =>
                    update(
                      "has_legal_expenses_insurance",

                      parseInsuranceOption(
                        event.target.value,
                      ),
                    )
                  }
                />

                <span className="actor-choice-indicator" />

                <span className="actor-choice-copy">
                  <strong>
                    Yes
                  </strong>

                  <small>
                    This actor has legal
                    expenses insurance.
                  </small>
                </span>
              </label>

              <label
                className={[
                  "actor-choice-card",

                  insuranceOption === "no"
                    ? "actor-choice-card-selected"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <input
                  type="radio"
                  name="legal-expenses-insurance"
                  value="no"
                  checked={
                    insuranceOption ===
                    "no"
                  }
                  onChange={(event) =>
                    update(
                      "has_legal_expenses_insurance",

                      parseInsuranceOption(
                        event.target.value,
                      ),
                    )
                  }
                />

                <span className="actor-choice-indicator" />

                <span className="actor-choice-copy">
                  <strong>
                    No
                  </strong>

                  <small>
                    This actor does not
                    have legal expenses
                    insurance.
                  </small>
                </span>
              </label>

              <label
                className={[
                  "actor-choice-card",

                  insuranceOption ===
                  "not_applicable"
                    ? "actor-choice-card-selected"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <input
                  type="radio"
                  name="legal-expenses-insurance"
                  value="not_applicable"
                  checked={
                    insuranceOption ===
                    "not_applicable"
                  }
                  onChange={(event) =>
                    update(
                      "has_legal_expenses_insurance",

                      parseInsuranceOption(
                        event.target.value,
                      ),
                    )
                  }
                />

                <span className="actor-choice-indicator" />

                <span className="actor-choice-copy">
                  <strong>
                    Not applicable
                  </strong>

                  <small>
                    Suitable for courts,
                    public authorities or
                    similar institutions.
                  </small>
                </span>
              </label>
            </div>
          </section>

          <section className="actor-form-section">
            <div className="actor-section-heading actor-section-heading-with-control">
              <div className="actor-section-heading-main">
                <span className="actor-section-number">
                  04
                </span>

                <div>
                  <h3>
                    Negotiation profile
                  </h3>

                  <p>
                    Optional behavioural
                    characteristics used
                    when simulating
                    decisions and
                    negotiations.
                  </p>
                </div>
              </div>

              <label className="actor-profile-toggle">
                <input
                  type="checkbox"
                  checked={
                    !profileApplicable
                  }
                  onChange={(event) =>
                    handleProfileApplicabilityChange(
                      !event.target.checked,
                    )
                  }
                />

                <span className="actor-profile-toggle-control" />

                <span>
                  Not applicable
                </span>
              </label>
            </div>

            {!profileApplicable ? (
              <div className="actor-profile-disabled">
                <span className="actor-profile-disabled-icon">
                  —
                </span>

                <div>
                  <strong>
                    No negotiation profile
                  </strong>

                  <p>
                    This is suitable for
                    courts, authorities,
                    administrative bodies
                    or other actors for whom
                    personal negotiation
                    behaviour is not
                    applicable.
                  </p>
                </div>
              </div>
            ) : (
              <div className="actor-negotiation-profile">
                {NEGOTIATION_FIELDS.map(
                  (field) => {
                    const value =
                      form
                        .negotiation_profile?.[
                        field.key
                      ] ??
                      DEFAULT_NEGOTIATION_PROFILE[
                        field.key
                      ];

                    return (
                      <div
                        className="actor-slider-field"
                        key={field.key}
                      >
                        <div className="actor-slider-heading">
                          <div>
                            <label
                              htmlFor={`actor-${field.key}`}
                            >
                              {field.label}
                            </label>

                            <p>
                              {
                                field.description
                              }
                            </p>
                          </div>

                          <output
                            htmlFor={`actor-${field.key}`}
                          >
                            {value}
                          </output>
                        </div>

                        <input
                          id={`actor-${field.key}`}
                          className="actor-slider"
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={value}
                          style={{
                            "--actor-slider-value":
                              `${value}%`,
                          }}
                          onChange={(event) =>
                            updateNegotiationProfile(
                              field.key,
                              event.target.value,
                            )
                          }
                        />

                        <div className="actor-slider-labels">
                          <span>
                            {
                              field.lowLabel
                            }
                          </span>

                          <span>
                            {
                              field.highLabel
                            }
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
              className="actor-modal-error"
              role="alert"
            >
              {validationError}
            </div>
          )}
        </div>

        <footer className="actor-modal-footer">
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
            {actor
              ? "Save Changes"
              : "Add Actor"}
          </button>
        </footer>
      </div>
    </div>
  );
}