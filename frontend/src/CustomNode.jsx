import { Handle, Position } from "reactflow";

export default function CustomNode({ data }) {
  return (
    <div
      style={{
        padding: 14,
        border: "1px solid #c08497",
        borderRadius: 12,
        background: "linear-gradient(135deg, #2b0f1a, #3a1524)",
        width: 300,
        color: "#f5e9ec",
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
      }}
    >
      {/* LEFT INPUT HANDLE */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#c08497" }}
      />

      <div>
        <strong style={{ fontSize: 14, letterSpacing: 0.3 }}>
          {data.title}
        </strong>

        <p
          style={{
            fontSize: 12,
            opacity: 0.85,
            marginTop: 6,
            lineHeight: 1.4,
          }}
        >
          {data.summary}
        </p>

        <pre
          style={{
            fontSize: 10,
            marginTop: 8,
            background: "rgba(255,255,255,0.05)",
            padding: 8,
            borderRadius: 8,
            overflow: "auto",
          }}
        >
          {JSON.stringify(data.state, null, 2)}
        </pre>
      </div>

      {/* RIGHT OUTPUT HANDLE */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#c08497" }}
      />
    </div>
  );
}