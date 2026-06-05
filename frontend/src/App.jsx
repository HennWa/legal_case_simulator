import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";  // for rendering context menu outside of React Flow's canvas
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import "./App.css";

import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";
import Sidebar from "./Sidebar";
import ContextMenuRightClick from "./ContextMenuRightClick";
import TopBar from "./TopBar";
import { layoutGraph } from "./layout";

import { fetchNode } from "./api/node";
import { fetchGraph } from "./api/graph";
import { addNode } from "./api/add_node";
import { deleteNode } from "./api/delete_node";


function App() {

  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeData, setSelectedNodeData] = useState(null);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  const [contextMenuRightClick, setContextMenuRightClick] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingNodeId, setProcessingNodeId] = useState(null);


  const loadGraph = async () => {
      try {
        const data = await fetchGraph();
        setGraphData(data);
      } catch (err) {
        console.error(err);
      }
    };

  // ACTIONS ON RIGHT CLICK (EMPTY LOGIC FOR NOW)
    const handleAdd = async (nodeId) => {
      try {
        setIsProcessing(true);
        setContextMenuRightClick(null);

        console.log('Adding node', nodeId);
        await addNode(nodeId);
        console.log('Node added', nodeId);
        console.log('Updating Graph');
        await loadGraph();
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    };

  const handleDeactivate = (nodeId) => {
    console.log("Deactivate node:", nodeId);
    setContextMenuRightClick(null);
  };

  const handleDelete = async (nodeId) => {
      try {
        setContextMenuRightClick(null);

        console.log('Deleting node', nodeId);
        await deleteNode(nodeId);
        console.log('Node deleted', nodeId);
        await loadGraph();
      } catch (err) {
        console.error(err);
      }
    };

  // RIGHT CLICK HANDLER
  const onNodeContextMenuRightClick = (event, node) => {
      event.preventDefault();
      console.log("🟢 STEP 1: React Flow detected right click", node?.id);

      setContextMenuRightClick({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    };

  // CLOSE ON OUTSIDE CLICK
  useEffect(() => {
    //if (!contextMenuRightClick) return;

    //const handleClick = () => setContextMenuRightClick(null);

    //window.addEventListener("mousedown", handleClick);
    //return () => window.removeEventListener("mousedown", handleClick);
  }, [contextMenuRightClick]);


  // SET GRAPH
  useEffect(() => {
      loadGraph();
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
              onNodeContextMenu={onNodeContextMenuRightClick}
                onPaneClick={() => {
                    setContextMenuRightClick(null);
                  }}

              onMoveStart={() => {
                    setContextMenuRightClick(null);
                  }}
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

          {contextMenuRightClick &&
            createPortal(
              <ContextMenuRightClick
                x={contextMenuRightClick.x}
                y={contextMenuRightClick.y}
                nodeId={contextMenuRightClick.nodeId}
                onAdd={handleAdd}
                onDeactivate={handleDeactivate}
                onDelete={handleDelete}
              />,
              document.body
            )}

          {isProcessing && (
              <div className="loading-indicator">
                <div className="spinner" />
                <span>Updating Legal Steps...</span>
              </div>
            )}

          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}

export default App;