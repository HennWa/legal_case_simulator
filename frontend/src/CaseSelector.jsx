import { useEffect, useRef, useState } from "react";

export default function CaseSelector({
  cases,
  selectedCaseId,
  onSelectCase,
  onCreateCase,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected =
    cases.find((c) => c.id === selectedCaseId) || null;

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: 260,
      }}
    >
      {/* Selected case */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(192,132,151,0.12)",
          border: "1px solid rgba(192,132,151,0.35)",
          color: "#f4ecee",
          borderRadius: 8,
          padding: "8px 12px",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        <span>{selected ? selected.title : "Select case"}</span>
        <span>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            width: "100%",
            background: "#20161a",
            border: "1px solid rgba(192,132,151,0.35)",
            borderRadius: 8,
            overflow: "hidden",
            zIndex: 1000,
            boxShadow: "0 6px 18px rgba(0,0,0,.35)",
          }}
        >
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                onSelectCase(c.id);
                setOpen(false);
              }}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                color:
                  c.id === selectedCaseId
                    ? "#c08497"
                    : "#f4ecee",
                background:
                  c.id === selectedCaseId
                    ? "rgba(192,132,151,.08)"
                    : "transparent",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "rgba(192,132,151,.12)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  c.id === selectedCaseId
                    ? "rgba(192,132,151,.08)"
                    : "transparent")
              }
            >
              {c.title}
            </div>
          ))}

          <div
            style={{
              borderTop: "1px solid rgba(192,132,151,.25)",
            }}
          />

          <div
            onClick={() => {
              setOpen(false);
              onCreateCase();
            }}
            style={{
              padding: "10px 12px",
              cursor: "pointer",
              color: "#c08497",
              fontWeight: 600,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "rgba(192,132,151,.12)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            + New Case
          </div>
        </div>
      )}
    </div>
  );
}