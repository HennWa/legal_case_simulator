import {
  Handle,
  Position,
} from "reactflow";


export default function CustomNode({
  data,
}) {
  return (
    <div
      style={{
        /*
         * IMPORTANT:
         *
         * This width must match the
         * Dagre width in layout.js and
         * REAL_NODE_WIDTH in SimulatorApp.jsx.
         */
        width: 320,

        /*
         * Padding and border are included
         * inside the 320 px width.
         */
        boxSizing: "border-box",

        minHeight: 140,

        background: "#ffffff",

        border:
          "1px solid #e7d6da",

        borderRadius: 16,

        padding: 18,

        boxShadow:
          "0 4px 12px rgba(0,0,0,0.06)",

        color: "#2d2d2d",

        display: "flex",

        flexDirection:
          "column",

        position:
          "relative",

        pointerEvents:
          "all",
      }}
    >
      {/* LEFT INPUT HANDLE */}
      <Handle
        type="target"
        position={
          Position.Left
        }
        style={{
          width: 10,

          height: 10,

          background:
            "#b97784",

          border:
            "2px solid white",
        }}
      />


      {/* TOP ICON */}
      <div
        style={{
          width: 36,

          height: 36,

          borderRadius: 10,

          background:
            "linear-gradient(135deg, #9c5866, #b97784)",

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          color: "white",

          fontSize: 18,

          marginBottom: 14,

          flexShrink: 0,
        }}
      >
        ⚖
      </div>


      {/* STEP NUMBER */}
      <div
        style={{
          fontSize: 11,

          fontWeight: 600,

          color: "#9c5866",

          letterSpacing: 1,

          marginBottom: 8,
        }}
      >
        STATE{" "}
        {data.number || ""}
      </div>


      {/* TITLE */}
      <div
        title={
          data.title ?? ""
        }
        style={{
          fontSize: 15,

          fontWeight: 600,

          lineHeight: 1.3,

          marginBottom: 10,

          /*
           * Maximum 2 lines.
           */
          display:
            "-webkit-box",

          WebkitBoxOrient:
            "vertical",

          WebkitLineClamp: 2,

          overflow: "hidden",

          textOverflow:
            "ellipsis",

          overflowWrap:
            "anywhere",
        }}
      >
        {data.title}
      </div>


      {/* SUMMARY */}
      <div
        title={
          data.summary ?? ""
        }
        style={{
          fontSize: 12,

          lineHeight: 1.5,

          color: "#666",

          marginBottom: 14,

          /*
           * Maximum 4 lines.
           */
          display:
            "-webkit-box",

          WebkitBoxOrient:
            "vertical",

          WebkitLineClamp: 4,

          overflow: "hidden",

          textOverflow:
            "ellipsis",

          overflowWrap:
            "anywhere",
        }}
      >
        {data.summary}
      </div>


      {/* FOOTER BADGE */}
      <div
        style={{
          alignSelf:
            "flex-start",

          background:
            "#f3e6e9",

          color:
            "#9c5866",

          borderRadius: 999,

          padding:
            "4px 10px",

          fontSize: 11,

          fontWeight: 500,

          flexShrink: 0,
        }}
      >
        State
      </div>


      {/* RIGHT OUTPUT HANDLE */}
      <Handle
        type="source"
        position={
          Position.Right
        }
        style={{
          width: 10,

          height: 10,

          background:
            "#b97784",

          border:
            "2px solid white",
        }}
      />
    </div>
  );
}