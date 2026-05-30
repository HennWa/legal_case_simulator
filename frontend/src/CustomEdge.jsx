import { getBezierPath } from "reactflow";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      {/* the actual edge line */}
      <path
        id={id}
        d={edgePath}
        style={{
          stroke: "#c08497",
          strokeWidth: 2,
          fill: "none",
          ...style,
        }}
        markerEnd={markerEnd}
      />

      {/* 🧾 ACTION BOX */}
      <foreignObject
        width={220}
        height={120}
        x={labelX - 110}
        y={labelY - 60}
        style={{ overflow: "visible" }}
      >
        <div
          style={{
            background: "rgba(58, 21, 36, 0.95)",
            border: "1px solid #c08497",
            borderRadius: 10,
            padding: 10,
            color: "#f5e9ec",
            fontSize: 11,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {/* Action type */}
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>
            {data?.action_type}
          </div>

          {/* Actors */}
          <div style={{ opacity: 0.9 }}>
            <strong>From:</strong> {data?.source_actor}
          </div>

          <div style={{ opacity: 0.9 }}>
            <strong>To:</strong> {data?.target_actor}
          </div>

          {/* Artifact */}
          <div style={{ marginTop: 6, opacity: 0.85 }}>
            <strong>Artifact:</strong> {data?.artifact}
          </div>
        </div>
      </foreignObject>
    </>
  );
}