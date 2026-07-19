import {
  useEffect,
  useRef,
  useState,
} from "react";

import logo from "../assets/logos/logo.png";

export default function TopBar({
  cases,
  selectedCaseId,
  onSelectCase,
  onCreateCase,
  activeTab,
  onTabChange,
}) {
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  const selectedCase =
    cases.find(
      (currentCase) =>
        currentCase.id === selectedCaseId
    ) ?? null;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const tabs = [
    {
      id: "graph",
      label: "Graph",
    },
    {
      id: "documents",
      label: "Documents",
    },
    {
      id: "actors",
      label: "Actors",
    },
  ];

  return (
    <header
      style={{
        flexShrink: 0,
        height: 56,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxSizing: "border-box",
        background:
          "linear-gradient(180deg, #1b1216 0%, #140d10 100%)",
        borderBottom:
          "1px solid rgba(192,132,151,0.25)",
        position: "relative",
        zIndex: 2000,
      }}
    >
      {/* LEFT */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          minWidth: 0,
        }}
      >
        <img
          src={logo}
          alt="Casendra"
          style={{
            flexShrink: 0,
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
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() =>
              setOpen((current) => !current)
            }
            style={{
              width: "100%",
              minHeight: 34,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              background:
                "rgba(192,132,151,0.12)",
              border:
                "1px solid rgba(192,132,151,0.35)",
              color: "#f4ecee",
              borderRadius: 8,
              padding: "7px 12px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <span
              style={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedCase
                ? selectedCase.title
                : "Select case"}
            </span>

            <span
              style={{
                flexShrink: 0,
                fontSize: 9,
                opacity: 0.8,
              }}
            >
              {open ? "▲" : "▼"}
            </span>
          </button>

          {open && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 7px)",
                left: 0,
                width: "100%",
                maxHeight: 360,
                overflowY: "auto",
                background: "#20161a",
                border:
                  "1px solid rgba(192,132,151,0.35)",
                borderRadius: 8,
                zIndex: 3000,
                boxShadow:
                  "0 8px 20px rgba(0,0,0,.35)",
              }}
            >
              {cases.length === 0 ? (
                <div
                  style={{
                    padding: "12px",
                    color:
                      "rgba(244,236,238,0.55)",
                    fontSize: 12,
                  }}
                >
                  No cases available
                </div>
              ) : (
                cases.map((currentCase) => (
                  <button
                    type="button"
                    key={currentCase.id}
                    onClick={() => {
                      onSelectCase(
                        currentCase.id
                      );

                      setOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "block",
                      padding: "10px 12px",
                      border: "none",
                      background:
                        currentCase.id ===
                        selectedCaseId
                          ? "rgba(192,132,151,.12)"
                          : "transparent",
                      color:
                        currentCase.id ===
                        selectedCaseId
                          ? "#c08497"
                          : "#f4ecee",
                      fontFamily: "inherit",
                      fontSize: 13,
                      textAlign: "left",
                      cursor: "pointer",
                      transition:
                        "background .15s",
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background =
                        "rgba(192,132,151,.15)";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background =
                        currentCase.id ===
                        selectedCaseId
                          ? "rgba(192,132,151,.12)"
                          : "transparent";
                    }}
                  >
                    {currentCase.title}
                  </button>
                ))
              )}

              <div
                style={{
                  borderTop:
                    "1px solid rgba(192,132,151,0.25)",
                }}
              />

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onCreateCase();
                }}
                style={{
                  width: "100%",
                  display: "block",
                  padding: "10px 12px",
                  border: "none",
                  background: "transparent",
                  color: "#c08497",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "left",
                  cursor: "pointer",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background =
                    "rgba(192,132,151,.15)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background =
                    "transparent";
                }}
              >
                + New Case
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CENTER TABS */}
      <nav
        aria-label="Case sections"
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "stretch",
          gap: 4,
        }}
      >
        {tabs.map((tab) => {
          const isActive =
            activeTab === tab.id;

          return (
            <button
              type="button"
              key={tab.id}
              onClick={() =>
                onTabChange(tab.id)
              }
              aria-current={
                isActive ? "page" : undefined
              }
              style={{
                position: "relative",
                minWidth: 92,
                padding: "0 16px",
                border: "none",
                background: isActive
                  ? "rgba(192,132,151,0.11)"
                  : "transparent",
                color: isActive
                  ? "#f3dce4"
                  : "rgba(244,236,238,0.62)",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: isActive
                  ? 650
                  : 500,
                cursor: "pointer",
                transition:
                  "background 150ms ease, color 150ms ease",
              }}
              onMouseEnter={(event) => {
                if (!isActive) {
                  event.currentTarget.style.background =
                    "rgba(192,132,151,0.07)";

                  event.currentTarget.style.color =
                    "#f4ecee";
                }
              }}
              onMouseLeave={(event) => {
                if (!isActive) {
                  event.currentTarget.style.background =
                    "transparent";

                  event.currentTarget.style.color =
                    "rgba(244,236,238,0.62)";
                }
              }}
            >
              {tab.label}

              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    right: 14,
                    bottom: 0,
                    height: 2,
                    borderRadius:
                      "2px 2px 0 0",
                    background: "#c08497",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* RIGHT */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          type="button"
          style={buttonStyle}
        >
          Export
        </button>

        <button
          type="button"
          style={buttonStyle}
        >
          Settings
        </button>
      </div>
    </header>
  );
}

const buttonStyle = {
  minHeight: 32,
  background: "rgba(192,132,151,0.12)",
  border: "1px solid rgba(192,132,151,0.35)",
  color: "#f4ecee",
  padding: "6px 10px",
  borderRadius: 8,
  fontFamily: "inherit",
  fontSize: 12,
  cursor: "pointer",
};