import "./NodeDetailsPanel.css";
import "./ArtifactCard.css";
import { useEffect, useState } from "react";
import ReferenceModal from "../ReferenceModal/ReferenceModal";
import ArtifactModal from "../ArtifactModal/ArtifactModal";
import { fetchArtifacts } from "../../api/artifact";

export default function NodeDetailsPanel({
  node,
  onClose,
}) {
  const [selectedReferences, setSelectedReferences] = useState(null);
  const [selectedArtifacts, setSelectedArtifacts] = useState(null);

  const [artifacts, setArtifacts] = useState([]);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [artifactError, setArtifactError] = useState(null);

  const state = node?.state ?? {};

  const legalReferences = state.legal_references ?? [];
  const artifactIds = state.artifact_ids ?? [];
  const actorsStatus = state.actors_status ?? [];

  useEffect(() => {
    const loadArtifacts = async () => {
      if (artifactIds.length === 0) {
        setArtifacts([]);
        setArtifactError(null);
        return;
      }

      try {
        setLoadingArtifacts(true);
        setArtifactError(null);

        const loadedArtifacts = await fetchArtifacts(artifactIds);
        setArtifacts(loadedArtifacts);
      } catch (error) {
        console.error("Failed to load artifacts:", error);
        setArtifacts([]);
        setArtifactError("Failed to load documents.");
      } finally {
        setLoadingArtifacts(false);
      }
    };

    loadArtifacts();
  }, [node?.id]);

  if (!node) return null;

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
          <h3>Documents</h3>

          {loadingArtifacts ? (
            <p>Loading documents...</p>
          ) : artifactError ? (
            <p>{artifactError}</p>
          ) : artifacts.length === 0 ? (
            <p>No artifacts</p>
          ) : (
            artifacts.map((art) => (
              <div
                key={art.id}
                className="artifact-card"
                onClick={() => setSelectedArtifacts([art])}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelectedArtifacts(artifacts);
                }}
              >
                <div className="artifact-header">
                  <span className="artifact-type">{art.type}</span>

                  <span className="artifact-date">
                    {new Date(art.timestamp_created).toLocaleDateString()}
                  </span>
                </div>

                <div className="artifact-title">
                  {art.title}
                </div>

                <p className="artifact-preview">
                  {art.extracted_content?.slice(0, 180) ??
                    art.content.slice(0, 180)}
                  ...
                </p>
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

      <div className="node-question-box">
        <textarea
          className="node-question-input"
          placeholder="Any questions about this step?"
          rows={2}
        />
      </div>

      {selectedReferences && (
        <ReferenceModal
          references={selectedReferences}
          onClose={() => setSelectedReferences(null)}
        />
      )}

      {selectedArtifacts && (
        <ArtifactModal
          artifacts={selectedArtifacts}
          onClose={() => setSelectedArtifacts(null)}
        />
      )}
    </div>
  );
}