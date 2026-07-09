import "./ArtifactModal.css";

export default function ArtifactModal({
  artifacts,
  onClose,
}) {

  if (!Array.isArray(artifacts)) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="reference-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Documents</h2>

          <button className="modal-close-button" onClick={onClose}>
              ✕
            </button>
        </div>

        <div className="modal-content">
          {artifacts.length === 0 ? (
            <p>No artifacts available.</p>
          ) : (
            artifacts.map((art, index) => (
              <div
                key={index}
                className="artifact-detail-card"
              >
                <div className="artifact-title">
                  {art.title ?? "No title"}
                </div>

                <div className="artifact-type">
                  {art.type ?? "unknown"}
                </div>

                <div className="artifact-content">
                  <p>Content</p>
                  {art.content ?? "No content"}
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}