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
      {/* Connector */}
      <path
        id={id}
        d={edgePath}
        style={{
          stroke: "#c7a5ad",
          strokeWidth: 1.5,
          fill: "none",
          strokeDasharray: "4 4",
          ...style,
        }}
        markerEnd={markerEnd}
      />

      {/* Small floating label */}
      <foreignObject
        width={180}
        height={70}
        x={labelX - 90}
        y={labelY - 35}
        style={{
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.96)",

            border: "1px solid #eadde0",

            borderRadius: 12,

            padding: "8px 10px",

            boxShadow:
              "0 2px 8px rgba(0,0,0,0.05)",

            textAlign: "center",

            color: "#555",

            fontSize: 11,
          }}
        >
          <div
            style={{
              color: "#9c5866",
              fontWeight: 600,
              fontSize: 11,
              marginBottom: 2,
            }}
          >
            {data?.action_type}
          </div>

          <div
            style={{
              fontSize: 10,
              color: "#777",
            }}
          >
            {data?.source_actor}
            {" → "}
            {data?.target_actor}
          </div>
        </div>
      </foreignObject>
    </>
  );
}