import "./NodeDetailsPanel.css";
import { useState } from "react";
import ReferenceModal from "./ReferenceModal";

export default function NodeDetailsPanel({
  node,
  onClose,
}) {
  const [selectedReferences, setSelectedReferences] = useState(null);

  if (!node) return null;

  const state = node.state ?? {};

  const legalReferences = state.legal_references ?? [];
  const artifacts = state.artifacts ?? [];
  const actorsStatus = state.actors_status ?? [];

  return (
    <div className="node-details-panel">
      <div className="panel-header">
        <h2>{node.title}</h2>

        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-content">

        {/* SUMMARY */}
        <section>
          <h3>Summary</h3>
          <p>{node.summary}</p>
        </section>

        {/* DESCRIPTION */}
        <section>
          <h3>Description</h3>
          <p>{state.description}</p>
        </section>

        {/* LEGAL REFERENCES */}
        <section>
          <h3>Legal References</h3>

          {legalReferences.length === 0 ? (
            <p>No references</p>
          ) : (
            legalReferences.map((ref, i) => (
              <div
                key={i}
                className="reference-card"
                onClick={() => setSelectedReferences([ref])}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelectedReferences(legalReferences);
                }}
              >
                <strong>{ref.reference}</strong>
              </div>
            ))
          )}
        </section>

        {/* ARTIFACTS */}
        <section>
          <h3>Artifacts</h3>

          {artifacts.length === 0 ? (
            <p>No artifacts</p>
          ) : (
            artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="artifact-card"
              >
                <strong>{artifact.type}</strong>
                <p>{artifact.content}</p>
                <small>{artifact.timestamp}</small>
              </div>
            ))
          )}
        </section>

        {/* ACTORS */}
        <section>
          <h3>Actors Status</h3>

          {actorsStatus.length === 0 ? (
            <p>No actors</p>
          ) : (
            actorsStatus.map((actorStatus) => (
              <div
                key={actorStatus.actor.id}
                className="actor-card"
              >
                <strong>{actorStatus.actor.name}</strong>
                <div>Role: {actorStatus.actor.role}</div>
                <div>Paid: {actorStatus.paid}</div>
                <div>Received: {actorStatus.received}</div>
              </div>
            ))
          )}
        </section>
      </div>

      {/* MODAL */}
      {selectedReferences && (
        <ReferenceModal
          references={selectedReferences}
          onClose={() => setSelectedReferences(null)}
        />
      )}
    </div>
  );
}