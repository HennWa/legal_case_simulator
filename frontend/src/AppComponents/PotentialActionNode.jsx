import {
  Handle,
  Position,
} from "reactflow";


export default function PotentialActionNode({
  data,
}) {
  const isProcessing =
    Boolean(data?.isProcessing);

  return (
    <div
      className="nodrag nopan"
      style={{
        width: 220,

        display: "flex",
        alignItems: "center",

        position: "relative",

        pointerEvents: "all",

        opacity: isProcessing
          ? 0.65
          : 1,

        transition:
          "opacity 0.2s ease",
      }}
    >
      {/* Invisible target anchor for React Flow */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        style={{
          width: 1,
          height: 1,

          left: 0,

          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Clickable potential action */}
      <div
        style={{
          width: "100%",

          display: "flex",
          alignItems: "center",

          gap: 8,

          padding: "6px 10px",

          borderRadius: 10,

          border:
            "1px dashed rgba(192, 132, 151, 0.55)",

          background:
            "rgba(255, 255, 255, 0.82)",

          boxShadow:
            "0 2px 7px rgba(156, 88, 102, 0.06)",

          cursor: isProcessing
            ? "default"
            : "pointer",

          color: "#9c5866",

          fontSize: 12,
          fontWeight: 600,

          lineHeight: 1.4,

          userSelect: "none",

          transition:
            "all 0.15s ease",
        }}
        onMouseEnter={(event) => {
          if (isProcessing) {
            return;
          }

          event.currentTarget.style.background =
            "#f7ecef";

          event.currentTarget.style.borderColor =
            "#c08497";

          event.currentTarget.style.transform =
            "translateX(2px)";

          event.currentTarget.style.boxShadow =
            "0 3px 10px rgba(156, 88, 102, 0.12)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background =
            "rgba(255, 255, 255, 0.82)";

          event.currentTarget.style.borderColor =
            "rgba(192, 132, 151, 0.55)";

          event.currentTarget.style.transform =
            "translateX(0)";

          event.currentTarget.style.boxShadow =
            "0 2px 7px rgba(156, 88, 102, 0.06)";
        }}
      >
        <span
          style={{
            flexShrink: 0,

            width: 20,
            height: 20,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            borderRadius: "50%",

            background:
              "rgba(192, 132, 151, 0.15)",

            color: "#9c5866",

            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {isProcessing
            ? "…"
            : "+"}
        </span>

        <span
          style={{
            flex: 1,
          }}
        >
          {isProcessing
            ? "Creating next state..."
            : data?.action}
        </span>
      </div>
    </div>
  );
}