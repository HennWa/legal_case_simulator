import logo from "./assets/logos/logo.png";

export default function TopBar() {
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
        background: "linear-gradient(180deg, #1b1216 0%, #140d10 100%)",
        borderBottom: "1px solid rgba(192,132,151,0.25)",
      }}
    >
      {/* LEFT: LOGO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
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

        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#f4ecee",
            letterSpacing: 0.5,
          }}
        >

        </div>
      </div>

      {/* RIGHT: ACTIONS (future buttons) */}
      <div style={{ display: "flex", gap: 10 }}>
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