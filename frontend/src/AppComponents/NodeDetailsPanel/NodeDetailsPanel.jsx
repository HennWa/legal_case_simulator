import { useEffect, useState } from "react";

import ReferenceModal from "../ReferenceModal/ReferenceModal";
import ArtifactModal from "../ArtifactModal/ArtifactModal";

import { fetchArtifacts } from "../../api/artifact";

import "./NodeDetailsPanel.css";
import "./ArtifactCard.css";


function formatCurrency(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value) || 0);
}


function getInsuranceLabel(value) {
  if (value === null || value === undefined) {
    return "Not applicable";
  }

  return value ? "Yes" : "No";
}


export default function NodeDetailsPanel({
  node,
  onClose,
}) {
  const [
    selectedReferences,
    setSelectedReferences,
  ] = useState(null);

  const [
    selectedArtifacts,
    setSelectedArtifacts,
  ] = useState(null);

  const [artifacts, setArtifacts] =
    useState([]);

  const [
    loadingArtifacts,
    setLoadingArtifacts,
  ] = useState(false);

  const [
    artifactError,
    setArtifactError,
  ] = useState(null);


  const state = node?.state ?? {};

  const legalReferences =
    state.legal_references ?? [];

  const artifactIds =
    state.artifact_ids ?? [];

  const actorsStatus =
    state.actors_status ?? [];


  useEffect(() => {
    let cancelled = false;

    const loadArtifacts = async () => {
      if (artifactIds.length === 0) {
        setArtifacts([]);
        setArtifactError(null);
        setLoadingArtifacts(false);
        return;
      }

      try {
        setLoadingArtifacts(true);
        setArtifactError(null);

        const loadedArtifacts =
          await fetchArtifacts(
            artifactIds,
          );

        if (!cancelled) {
          setArtifacts(
            Array.isArray(loadedArtifacts)
              ? loadedArtifacts
              : [],
          );
        }
      } catch (error) {
        console.error(
          "Failed to load artifacts:",
          error,
        );

        if (!cancelled) {
          setArtifacts([]);
          setArtifactError(
            "Failed to load documents.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingArtifacts(false);
        }
      }
    };

    loadArtifacts();

    return () => {
      cancelled = true;
    };
  }, [node?.id]);


  if (!node) {
    return null;
  }


  return (
    <>
      <div className="node-details-panel">
        <div className="panel-header">
          <h2>{node.title}</h2>

          <button
            type="button"
            className="close-button"
            aria-label="Close node details"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="panel-content">
          {/* SUMMARY */}
          <section>
            <h3>Summary</h3>

            <p>
              {node.summary ||
                "No summary available."}
            </p>
          </section>

          {/* DESCRIPTION */}
          <section>
            <h3>Description</h3>

            <p>
              {state.description ||
                "No description available."}
            </p>
          </section>

          {/* LEGAL REFERENCES */}
          <section>
            <h3>Legal References</h3>

            {legalReferences.length === 0 ? (
              <p>No references</p>
            ) : (
              legalReferences.map(
                (reference, index) => (
                  <div
                    key={
                      reference.id ??
                      `${reference.reference}-${index}`
                    }
                    className="reference-card"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setSelectedReferences([
                        reference,
                      ])
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        setSelectedReferences([
                          reference,
                        ]);
                      }
                    }}
                    onContextMenu={(
                      event,
                    ) => {
                      event.preventDefault();

                      setSelectedReferences(
                        legalReferences,
                      );
                    }}
                  >
                    <strong>
                      {reference.reference}
                    </strong>
                  </div>
                ),
              )
            )}
          </section>

          {/* ARTIFACTS */}
          <section>
            <h3>Documents</h3>

            {loadingArtifacts ? (
              <p>Loading documents...</p>
            ) : artifactError ? (
              <p>{artifactError}</p>
            ) : artifacts.length === 0 ? (
              <p>No artifacts</p>
            ) : (
              artifacts.map((artifact) => {
                const previewContent =
                  artifact.extracted_content ??
                  artifact.content ??
                  "";

                const timestamp =
                  artifact.timestamp_created
                    ? new Date(
                        artifact.timestamp_created,
                      )
                    : null;

                const formattedDate =
                  timestamp &&
                  !Number.isNaN(
                    timestamp.getTime(),
                  )
                    ? timestamp.toLocaleDateString()
                    : "";

                return (
                  <div
                    key={artifact.id}
                    className="artifact-card"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setSelectedArtifacts([
                        artifact,
                      ])
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        setSelectedArtifacts([
                          artifact,
                        ]);
                      }
                    }}
                    onContextMenu={(
                      event,
                    ) => {
                      event.preventDefault();

                      setSelectedArtifacts(
                        artifacts,
                      );
                    }}
                  >
                    <div className="artifact-header">
                      <span className="artifact-type">
                        {artifact.type ??
                          "Document"}
                      </span>

                      {formattedDate && (
                        <span className="artifact-date">
                          {formattedDate}
                        </span>
                      )}
                    </div>

                    <div className="artifact-title">
                      {artifact.title ??
                        "Untitled document"}
                    </div>

                    <p className="artifact-preview">
                      {previewContent
                        ? `${previewContent.slice(
                            0,
                            180,
                          )}${
                            previewContent.length >
                            180
                              ? "..."
                              : ""
                          }`
                        : "No preview available."}
                    </p>
                  </div>
                );
              })
            )}
          </section>

          {/* ACTORS */}
          <section>
            <h3>Actors Status</h3>

            {actorsStatus.length === 0 ? (
              <p>No actors</p>
            ) : (
              actorsStatus.map(
                (actorStatus, actorIndex) => {
                  const actor =
                    actorStatus.actor ?? {};

                  const expenses =
                    Array.isArray(
                      actorStatus.expenses,
                    )
                      ? actorStatus.expenses
                      : [];

                  const income =
                    Array.isArray(
                      actorStatus.income,
                    )
                      ? actorStatus.income
                      : [];

                  const totalExpenses =
                    expenses.reduce(
                      (
                        sum,
                        expense,
                      ) =>
                        sum +
                        (Number(
                          expense.amount,
                        ) || 0),
                      0,
                    );

                  const totalIncome =
                    income.reduce(
                      (
                        sum,
                        incomeItem,
                      ) =>
                        sum +
                        (Number(
                          incomeItem.amount,
                        ) || 0),
                      0,
                    );

                  return (
                    <div
                      key={
                        actor.id ??
                        `${actor.name}-${actorIndex}`
                      }
                      className="actor-card"
                    >
                      <strong>
                        {actor.name ??
                          "Unknown actor"}
                      </strong>

                      <div>
                        Role:{" "}
                        {actor.role ??
                          "Not specified"}
                      </div>

                      <div>
                        Legal expenses
                        insurance:{" "}
                        {getInsuranceLabel(
                          actor.has_legal_expenses_insurance,
                        )}
                      </div>

                      {/* EXPENSES */}
                      <div className="actor-financial-section">
                        <div className="actor-financial-header">
                          <span>
                            Expenses
                          </span>

                          <strong>
                            {formatCurrency(
                              totalExpenses,
                            )}
                          </strong>
                        </div>

                        {expenses.length ===
                        0 ? (
                          <div className="actor-financial-empty">
                            No expenses
                          </div>
                        ) : (
                          <ul className="actor-financial-list">
                            {expenses.map(
                              (
                                expense,
                                expenseIndex,
                              ) => (
                                <li
                                  key={
                                    expense.id ??
                                    `${expense.title}-${expenseIndex}`
                                  }
                                >
                                  <div>
                                    <strong>
                                      {expense.title ??
                                        "Expense"}
                                    </strong>

                                    {expense.paid_to && (
                                      <span>
                                        Paid to:{" "}
                                        {
                                          expense.paid_to
                                        }
                                      </span>
                                    )}

                                    {expense.covered_by_insurance ===
                                      true && (
                                      <span>
                                        Covered by
                                        insurance
                                      </span>
                                    )}
                                  </div>

                                  <strong>
                                    {formatCurrency(
                                      expense.amount,
                                    )}
                                  </strong>
                                </li>
                              ),
                            )}
                          </ul>
                        )}
                      </div>

                      {/* INCOME */}
                      <div className="actor-financial-section">
                        <div className="actor-financial-header">
                          <span>
                            Income
                          </span>

                          <strong>
                            {formatCurrency(
                              totalIncome,
                            )}
                          </strong>
                        </div>

                        {income.length ===
                        0 ? (
                          <div className="actor-financial-empty">
                            No income
                          </div>
                        ) : (
                          <ul className="actor-financial-list">
                            {income.map(
                              (
                                incomeItem,
                                incomeIndex,
                              ) => (
                                <li
                                  key={
                                    incomeItem.id ??
                                    `${incomeItem.title}-${incomeIndex}`
                                  }
                                >
                                  <div>
                                    <strong>
                                      {incomeItem.title ??
                                        "Income"}
                                    </strong>

                                    {incomeItem.received_from && (
                                      <span>
                                        Received
                                        from:{" "}
                                        {
                                          incomeItem.received_from
                                        }
                                      </span>
                                    )}
                                  </div>

                                  <strong>
                                    {formatCurrency(
                                      incomeItem.amount,
                                    )}
                                  </strong>
                                </li>
                              ),
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                },
              )
            )}
          </section>
        </div>

        {/* FIXED QUESTION FIELD */}
        <div className="node-question-box">
          <textarea
            className="node-question-input"
            placeholder="Any questions about this step?"
            rows={2}
          />
        </div>
      </div>

      {/* MODALS */}
      {selectedReferences && (
        <ReferenceModal
          references={selectedReferences}
          onClose={() =>
            setSelectedReferences(null)
          }
        />
      )}

      {selectedArtifacts && (
        <ArtifactModal
          artifacts={selectedArtifacts}
          onClose={() =>
            setSelectedArtifacts(null)
          }
        />
      )}
    </>
  );
}