import "./NodeDetailsPanel.css";

export default function NodeDetailsPanel({
  node,
  onClose,
}) {
  if (!node) return null;

  const state = node.state;

  return (
    <div className="node-details-panel">
      <div className="panel-header">
        <h2>{node.title}</h2>

        <button onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-content">

        <section>
          <h3>Summary</h3>
          <p>{node.summary}</p>
        </section>

        <section>
          <h3>Description</h3>
          <p>{state.description}</p>
        </section>

        <section>
          <h3>Legal References</h3>

          {state.legal_references.length === 0 ? (
            <p>No references</p>
          ) : (
            state.legal_references.map((ref, i) => (
              <div key={i} className="reference-card">
                <strong>{ref.reference}</strong>
                <p>{ref.summary}</p>
              </div>
            ))
          )}
        </section>

        <section>
          <h3>Artifacts</h3>

          {state.artifacts.length === 0 ? (
            <p>No artifacts</p>
          ) : (
            state.artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="artifact-card"
              >
                <strong>{artifact.type}</strong>

                <p>{artifact.content}</p>

                <small>
                  {artifact.timestamp}
                </small>
              </div>
            ))
          )}
        </section>

        <section>
          <h3>Actors Status</h3>

          {state.actors_status.map((actorStatus) => (
            <div
              key={actorStatus.actor.id}
              className="actor-card"
            >
              <strong>
                {actorStatus.actor.name}
              </strong>

              <div>
                Role: {actorStatus.actor.role}
              </div>

              <div>
                Paid: {actorStatus.paid}
              </div>

              <div>
                Received: {actorStatus.received}
              </div>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
}