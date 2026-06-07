import "./ReferenceModal.css";

export default function ReferenceModal({
  references,
  onClose,
}) {

  console.log('------------')
  console.log(references)
  console.log(references.length === 0 )

  if (!Array.isArray(references)) return null;

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
          <h2>Legal References</h2>

          <button className="modal-close-button" onClick={onClose}>
              ✕
            </button>
        </div>

        <div className="modal-content">
          {references.length === 0 ? (
            <p>No references available.</p>
          ) : (
            references.map((ref, index) => (
              <div
                key={index}
                className="reference-detail-card"
              >
                <div className="reference-title">
                  {ref.reference ?? "No title"}
                </div>

                <div className="reference-type">
                  {ref.type ?? "unknown"}
                </div>

                <div className="reference-summary">
                  {ref.summary ?? ""}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}