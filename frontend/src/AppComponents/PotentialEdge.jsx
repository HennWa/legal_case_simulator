import {
  getBezierPath,
} from "reactflow";


export default function PotentialEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) {
  const [edgePath] =
    getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });

  return (
    <path
      id={id}
      d={edgePath}
      style={{
        stroke: "#c7a5ad",

        strokeWidth: 1.5,

        fill: "none",

        strokeDasharray:
          "5 5",

        opacity: 0.8,

        pointerEvents: "none",
      }}
    />
  );
}