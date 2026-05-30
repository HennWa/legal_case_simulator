import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import graphData from "./data/graph.json";
import CustomNode from "./CustomNode";
import { layoutGraph } from "./layout";

function App() {
  const { nodes, edges } = useMemo(() => {
    const rawNodes = Object.values(graphData.nodes);
    const rawEdges = Object.values(graphData.edges);

    const flowNodes = rawNodes.map((n) => ({
      id: n.id,
      type: "custom",
      data: n,
      position: { x: 0, y: 0 }, // layoutGraph will override this
    }));

    const flowEdges = rawEdges.map((e) => ({
      id: e.id,
      source: e.source_id,
      target: e.target_id,
      label: `${e.action_type} (${e.probability})`,
      animated: false,
      style: {
        stroke: "#c08497",
        strokeWidth: 2,
      },
    }));

    return layoutGraph(flowNodes, flowEdges);
  }, []);

  const nodeTypes = useMemo(() => {
    return { custom: CustomNode };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #2b0f1a 0%, #3a1524 60%, #f3d6dc 140%)",
      }}
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView

          // 🔥 Key UX improvements for legal graph feel
          defaultEdgeOptions={{
            type: "smoothstep",
          }}

          proOptions={{ hideAttribution: true }}
        >
          <MiniMap
            style={{
              backgroundColor: "#2b0f1a",
            }}
            nodeColor={() => "#c08497"}
          />

          <Controls />

          <Background color="#c08497" gap={18} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

export default App;