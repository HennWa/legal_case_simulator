import { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import graphData from "./data/graph.json";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";
import Sidebar from "./Sidebar";
import { layoutGraph } from "./layout";

function App() {
  const { nodes, edges } = useMemo(() => {
    const rawNodes = Object.values(graphData.nodes);
    const rawEdges = Object.values(graphData.edges);

    const flowNodes = rawNodes.map((n) => ({
      id: n.id,
      type: "custom",
      data: n,
      position: { x: 0, y: 0 },
    }));

    const flowEdges = rawEdges.map((e) => ({
      id: e.id,
      source: e.source_id,
      target: e.target_id,
      type: "custom",

      data: {
        action_type: e.action_type,
        source_actor: e.source_actor,
        target_actor: e.target_actor,
        artifact: e.artifact,
        probability: e.probability,
      },

      style: {
        stroke: "#c08497",
        strokeWidth: 2,
      },
    }));

    return layoutGraph(flowNodes, flowEdges);
  }, []);

  // ------------------------------------
  // SELECTED NODE STATE
  // ------------------------------------
  const [selectedNode, setSelectedNode] = useState(
    nodes.length > 0 ? nodes[0] : null
  );

  const nodeTypes = useMemo(() => {
    return { custom: CustomNode };
  }, []);

  const edgeTypes = useMemo(() => {
    return { custom: CustomEdge };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background:
          "linear-gradient(180deg, #faf7f8 0%, #f3edef 100%)",
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          width: "20vw",
          height: "100vh",
          borderRight: "1px solid #c08497",
          boxShadow: "4px 0 20px rgba(0,0,0,0.3)",
          overflowY: "auto",
          background: "#ffffff",
        }}
      >
        <Sidebar selectedNode={selectedNode} />
      </div>

      {/* GRAPH */}
      <div style={{ width: "80vw", height: "100vh" }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            onNodeClick={(event, node) => {
              setSelectedNode(node);
            }}
            defaultEdgeOptions={{
              type: "custom",
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

            <Background color="#e7d6da" gap={24} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export default App;