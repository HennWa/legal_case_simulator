
import { useEffect, useRef, useState } from "react";
import logo from "./assets/logos/logo.png";

export default function TopBar({
  cases,
  selectedCaseId,
  onSelectCase,
  onCreateCase,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedCase =
    cases.find((c) => c.id === selectedCaseId) || null;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  return (
    <div
      style={{
        height: 56,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxSizing: "border-box",
        background:
          "linear-gradient(180deg, #1b1216 0%, #140d10 100%)",
        borderBottom: "1px solid rgba(192,132,151,0.25)",
      }}
    >
      {/* LEFT */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <img
          src={logo}
          alt="logo"
          style={{
            height: 28,
            width: "auto",
          }}
        />

        {/* CASE SELECTOR */}
        <div
          ref={dropdownRef}
          style={{
            position: "relative",
            width: 280,
          }}
        >
          <button
            onClick={() => setOpen((v) => !v)}
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
            <span>
              {selectedCase ? selectedCase.title : "Select case"}
            </span>

            <span>{open ? "▲" : "▼"}</span>
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
                boxShadow: "0 8px 20px rgba(0,0,0,.35)",
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
                    background:
                      c.id === selectedCaseId
                        ? "rgba(192,132,151,.12)"
                        : "transparent",
                    color:
                      c.id === selectedCaseId
                        ? "#c08497"
                        : "#f4ecee",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(192,132,151,.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      c.id === selectedCaseId
                        ? "rgba(192,132,151,.12)"
                        : "transparent";
                  }}
                >
                  {c.title}
                </div>
              ))}

              <div
                style={{
                  borderTop:
                    "1px solid rgba(192,132,151,0.25)",
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "rgba(192,132,151,.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "transparent";
                }}
              >
                + New Case
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div
        style={{
          display: "flex",
          gap: 10,
        }}
      >
        <button style={buttonStyle}>Export</button>
        <button style={buttonStyle}>Settings</button>
      </div>
    </div>
  );
}

const buttonStyle = {
  background: "rgba(192,132,151,0.12)",
  border: "1px solid rgba(192,132,151,0.35)",
  color: "#f4ecee",
  padding: "6px 10px",
  borderRadius: 8,
  fontSize: 12,
  cursor: "pointer",
};

