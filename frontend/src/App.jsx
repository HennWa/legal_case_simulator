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
import TopBar from "./TopBar";

import { fetchNode } from "./api/node";

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
      data: e,
      style: {
        stroke: "#c08497",
        strokeWidth: 2,
      },
    }));

    return layoutGraph(flowNodes, flowEdges);
  }, []);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeData, setSelectedNodeData] = useState(null);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(180deg, #faf7f8 0%, #f3edef 100%)",
      }}
    >
      {/* TOP BAR */}
      <TopBar />

      {/* MAIN AREA */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* SIDEBAR */}
        <div
          style={{
            width: "20vw",
            borderRight: "1px solid #c08497",
            background: "#140d10",
            overflowY: "auto",
          }}
        >
          <Sidebar selectedNode={selectedNodeData} />
        </div>

        {/* GRAPH */}
        <div style={{ width: "80vw", height: "100%" }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
             onNodeClick={async (e, node) => {
                  setSelectedNodeId(node.id);

                  try {
                    const data = await fetchNode(node.id);
                    setSelectedNodeData(data);
                  } catch (err) {
                    console.error("Failed to load node:", err);
                  }
                }}
              proOptions={{ hideAttribution: true }}
            >
              <MiniMap nodeColor={() => "#c08497"} />
              <Controls />
              <Background color="#e7d6da" gap={24} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}

export default App;