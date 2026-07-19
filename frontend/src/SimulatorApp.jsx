import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createPortal } from "react-dom";

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from "reactflow";

import "reactflow/dist/style.css";

import "./App.css";

import CustomNode from "./AppComponents/CustomNode";
import CustomEdge from "./AppComponents/CustomEdge";
import Sidebar from "./AppComponents/Sidebar";
import ContextMenuRightClick from "./AppComponents/ContextMenuRightClick";

import NodeDetailsPanel from "./AppComponents/NodeDetailsPanel/NodeDetailsPanel";

import TopBar from "./AppComponents/TopBar";

import CreateCaseModal from "./AppComponents/CreateCaseModal/CreateCaseModal";

import DocumentsView from "./AppComponents/DocumentsView/DocumentsView";

import { layoutGraph } from "./layout";

import { fetchCases } from "./api/cases";
import { createCase } from "./api/create_case";
import { fetchNode } from "./api/node";
import { fetchGraph } from "./api/graph";
import { fetchSidebarStats } from "./api/sidebar_stats";
import { addNode } from "./api/add_node";
import { addNodeByAction } from "./api/add_node_by_action";
import { deleteNode } from "./api/delete_node";
import { legalCheck } from "./api/legal_check";
import { createArtifacts } from "./api/create_artifacts";

function SimulatorApp() {
  const [graphData, setGraphData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [cases, setCases] =
    useState([]);

  const [
    selectedCaseId,
    setSelectedCaseId,
  ] = useState(null);

  const [activeTab, setActiveTab] =
    useState("graph");

  const [
    selectedNodeId,
    setSelectedNodeId,
  ] = useState(null);

  const [
    selectedNodeData,
    setSelectedNodeData,
  ] = useState(null);

  const [
    selectedSidebarStats,
    setSelectedSidebarStats,
  ] = useState(null);

  const nodeTypes = useMemo(
    () => ({
      custom: CustomNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
    }),
    []
  );

  const [
    contextMenuRightClick,
    setContextMenuRightClick,
  ] = useState(null);

  const [detailsNode, setDetailsNode] =
    useState(null);

  const [
    createCaseModalOpen,
    setCreateCaseModalOpen,
  ] = useState(false);

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    isLegalCheck,
    setIsLegalCheck,
  ] = useState(false);

  const [
    isCreatingArtifacts,
    setIsCreatingArtifacts,
  ] = useState(false);

  const [
    processingNodeId,
    setProcessingNodeId,
  ] = useState(null);

  const createCase_ = async (payload) => {
    try {
      const newCase =
        await createCase(payload);

      setCases((previousCases) => [
        ...previousCases,
        newCase,
      ]);

      setSelectedCaseId(newCase.id);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCases = async () => {
    try {
      const defaultOwnerId = "111";

      const data =
        await fetchCases(defaultOwnerId);

      setCases(data);

      if (
        data.length > 0 &&
        !selectedCaseId
      ) {
        setSelectedCaseId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadGraph = async () => {
    if (!selectedCaseId) {
      setGraphData(null);
      return;
    }

    try {
      setLoading(true);

      const data =
        await fetchGraph(selectedCaseId);

      setGraphData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (nodeId) => {
    try {
      setIsProcessing(true);
      setContextMenuRightClick(null);

      console.log(
        "Adding node",
        nodeId
      );

      const newBranch = await addNode(
        selectedCaseId,
        nodeId
      );

      setIsProcessing(false);

      setIsCreatingArtifacts(true);

      await createArtifacts(
        selectedCaseId,
        newBranch.edge.id
      );

      setIsCreatingArtifacts(false);

      setIsLegalCheck(true);

      await legalCheck(
        selectedCaseId,
        newBranch.node.id
      );

      setIsLegalCheck(false);

      await loadGraph();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      setIsLegalCheck(false);
      setIsCreatingArtifacts(false);
    }
  };

  const handleAddByAction = async (
    nodeId,
    action
  ) => {
    try {
      setIsProcessing(true);
      setContextMenuRightClick(null);

      console.log(
        "Adding node by action",
        nodeId,
        action
      );

      const newBranch =
        await addNodeByAction(
          selectedCaseId,
          nodeId,
          action
        );

      setIsProcessing(false);

      setIsLegalCheck(true);

      await legalCheck(
        selectedCaseId,
        newBranch.node.id
      );

      setIsLegalCheck(false);

      setIsCreatingArtifacts(true);

      await createArtifacts(
        selectedCaseId,
        newBranch.edge.id
      );

      setIsCreatingArtifacts(false);

      await loadGraph();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      setIsLegalCheck(false);
      setIsCreatingArtifacts(false);
    }
  };

  const handleDeactivate = (nodeId) => {
    console.log(
      "Deactivate node:",
      nodeId
    );

    setContextMenuRightClick(null);
  };

  const handleDelete = async (
    nodeId
  ) => {
    try {
      setContextMenuRightClick(null);

      console.log(
        "Deleting node",
        nodeId
      );

      await deleteNode(
        selectedCaseId,
        nodeId
      );

      console.log(
        "Node deleted",
        nodeId
      );

      setDetailsNode(null);
      setSelectedNodeId(null);
      setSelectedNodeData(null);
      setSelectedSidebarStats(null);

      await loadGraph();
    } catch (err) {
      console.error(err);
    }
  };

  const onNodeContextMenuRightClick = (
    event,
    node
  ) => {
    event.preventDefault();

    setContextMenuRightClick({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      potentialNextStates:
        node.data?.state
          ?.potential_next_states ?? [],
    });
  };

  const handleTabChange = (
    nextTab
  ) => {
    setActiveTab(nextTab);

    setContextMenuRightClick(null);

    if (nextTab !== "graph") {
      setDetailsNode(null);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      loadGraph();
    }
  }, [selectedCaseId]);

  const { nodes, edges } = useMemo(() => {
    if (!graphData) {
      return {
        nodes: [],
        edges: [],
      };
    }

    const rawNodes =
      Object.values(graphData.nodes);

    const rawEdges =
      Object.values(graphData.edges);

    const flowNodes = rawNodes.map(
      (node) => ({
        id: node.id,
        type: "custom",
        data: node,
        position: {
          x: 0,
          y: 0,
        },
      })
    );

    const flowEdges = rawEdges.map(
      (edge) => ({
        id: edge.id,
        source: edge.source_id,
        target: edge.target_id,
        type: "custom",
        data: edge,
        style: {
          stroke: "#c08497",
          strokeWidth: 2,
        },
      })
    );

    return layoutGraph(
      flowNodes,
      flowEdges
    );
  }, [graphData]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #faf7f8 0%, #f3edef 100%)",
      }}
    >
      <TopBar
        cases={cases}
        selectedCaseId={
          selectedCaseId
        }
        onSelectCase={
          setSelectedCaseId
        }
        onCreateCase={() =>
          setCreateCaseModalOpen(true)
        }
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div
        style={{
          display: "flex",
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {activeTab === "graph" && (
          <>
            <aside
              style={{
                flexShrink: 0,
                width: "20vw",
                minWidth: 250,
                borderRight:
                  "1px solid #c08497",
                background: "#140d10",
                overflowY: "auto",
              }}
            >
              <Sidebar
                selectedNode={
                  selectedSidebarStats
                }
              />
            </aside>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                height: "100%",
                position: "relative",
              }}
            >
              <ReactFlowProvider>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  onNodeContextMenu={
                    onNodeContextMenuRightClick
                  }
                  onPaneClick={() => {
                      setSelectedNodeId(null);
                    setSelectedNodeData(null);
                    setSelectedSidebarStats(null);
                    setDetailsNode(null);
                    setContextMenuRightClick(
                      null
                    );
                  }}
                  onMoveStart={() => {
                    setContextMenuRightClick(
                      null
                    );
                  }}
                  onNodeClick={async (
                    event,
                    node
                  ) => {
                    try {
                      const data =
                        await fetchNode(
                          selectedCaseId,
                          node.id
                        );

                      setSelectedNodeId(
                        node.id
                      );

                      setSelectedNodeData(
                        data
                      );

                      setDetailsNode(data);

                      const stats =
                        await fetchSidebarStats(
                          selectedCaseId,
                          node.id
                        );

                      setSelectedSidebarStats(
                        stats
                      );
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  proOptions={{
                    hideAttribution: true,
                  }}
                >
                  <MiniMap
                    nodeColor={() =>
                      "#c08497"
                    }
                  />

                  <Controls />

                  <Background
                    color="#e7d6da"
                    gap={24}
                  />
                </ReactFlow>

                <NodeDetailsPanel
                  node={detailsNode}
                  onClose={() =>
                    setDetailsNode(null)
                  }
                />

                {contextMenuRightClick &&
                  createPortal(
                    <ContextMenuRightClick
                      x={
                        contextMenuRightClick.x
                      }
                      y={
                        contextMenuRightClick.y
                      }
                      nodeId={
                        contextMenuRightClick.nodeId
                      }
                      potentialNextStates={
                        contextMenuRightClick.potentialNextStates
                      }
                      onAdd={handleAdd}
                      onAddByAction={
                        handleAddByAction
                      }
                      onDeactivate={
                        handleDeactivate
                      }
                      onDelete={
                        handleDelete
                      }
                      onClose={() =>
                        setContextMenuRightClick(
                          null
                        )
                      }
                    />,
                    document.body
                  )}

                {isProcessing && (
                  <div className="loading-indicator">
                    <div className="spinner" />

                    <span>
                      creating next step...
                    </span>
                  </div>
                )}

                {isLegalCheck && (
                  <div className="loading-indicator">
                    <div className="spinner" />

                    <span>
                      legal check...
                    </span>
                  </div>
                )}

                {isCreatingArtifacts && (
                  <div className="loading-indicator">
                    <div className="spinner" />

                    <span>
                      creating documents...
                    </span>
                  </div>
                )}
              </ReactFlowProvider>
            </div>
          </>
        )}

        {activeTab === "documents" && (
          <DocumentsView
            caseId={selectedCaseId}
          />
        )}

        {activeTab === "actors" && (
          <main
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(180deg, #faf7f8 0%, #f3edef 100%)",
              color: "#756b6f",
            }}
          >
            <div
              style={{
                textAlign: "center",
              }}
            >
              <h2
                style={{
                  margin: "0 0 8px",
                  color: "#443b3e",
                }}
              >
                Actors
              </h2>

              <p
                style={{
                  margin: 0,
                }}
              >
                The Actors view will be
                implemented next.
              </p>
            </div>
          </main>
        )}
      </div>

      <CreateCaseModal
        open={createCaseModalOpen}
        onClose={() =>
          setCreateCaseModalOpen(false)
        }
        onCreate={async (payload) => {
          console.log(
            "CREATE CASE PAYLOAD",
            payload
          );

          await createCase_(payload);

          setCreateCaseModalOpen(false);
        }}
      />
    </div>
  );
}

export default SimulatorApp;