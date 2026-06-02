import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";  // for rendering context menu outside of React Flow's canvas
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";
import Sidebar from "./Sidebar";
import ContextMenu from "./ContextMenu";
import TopBar from "./TopBar";
import { layoutGraph } from "./layout";

import { fetchNode } from "./api/node";
import { fetchGraph } from "./api/graph";


function App() {

  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeData, setSelectedNodeData] = useState(null);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  const [contextMenu, setContextMenu] = useState(null);


  // ACTIONS (EMPTY LOGIC FOR NOW)
  const handleAdd = (nodeId) => {
    console.log("Add node from:", nodeId);
    setContextMenu(null);
  };

  const handleDeactivate = (nodeId) => {
    console.log("Deactivate node:", nodeId);
    setContextMenu(null);
  };

  const handleDelete = (nodeId) => {
    console.log("Delete node:", nodeId);
    setContextMenu(null);
  };

  // RIGHT CLICK HANDLER
  const onNodeContextMenu = (event, node) => {
      event.preventDefault();
      console.log("🟢 STEP 1: React Flow detected right click", node?.id);

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    };

  // CLOSE ON OUTSIDE CLICK
  useEffect(() => {
    if (!contextMenu) return;

    console.log("Outside CLiCKKKKKK");

    const handleClick = () => setContextMenu(null);

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [contextMenu]);


  // SET GRAPH
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchGraph();
        setGraphData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

// SET NODES & EDGES
  const { nodes, edges } = useMemo(() => {
    if (!graphData) return { nodes: [], edges: [] };

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
  }, [graphData]);

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
              onNodeContextMenu={onNodeContextMenu}
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

          {contextMenu &&
            createPortal(
              <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                nodeId={contextMenu.nodeId}
                onAdd={handleAdd}
                onDeactivate={handleDeactivate}
                onDelete={handleDelete}
              />,
              document.body
            )}

          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}

export default App;