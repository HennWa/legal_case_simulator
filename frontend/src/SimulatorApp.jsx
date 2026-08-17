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

import PotentialActionNode from "./AppComponents/PotentialActionNode";
import PotentialEdge from "./AppComponents/PotentialEdge";

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
import { addPossibleActions } from "./api/add_possible_actions";


/*
 * =========================================================
 * POTENTIAL ACTION LAYOUT CONFIGURATION
 * =========================================================
 */

/*
 * Dagre currently uses this width for
 * normal graph nodes.
 */
const REAL_NODE_WIDTH = 320;


/*
 * Real nodes have dynamic visual heights because
 * CustomNode uses minHeight rather than a fixed height.
 *
 * We therefore use a conservative height when checking
 * whether potential actions would overlap a real node.
 */
const REAL_NODE_COLLISION_HEIGHT = 420;


/*
 * Virtual potential-action dimensions.
 *
 * These are only used for manual frontend layout.
 */
const POTENTIAL_NODE_WIDTH = 220;
const POTENTIAL_NODE_HEIGHT = 34;


/*
 * Used when a node has NO real outgoing branch.
 *
 * The potential frontier appears to the right
 * of the source node.
 */
const POTENTIAL_X_OFFSET = 430;


/*
 * Vertical spacing between potential actions.
 *
 * Deliberately compact.
 */
const POTENTIAL_NODE_GAP = 6;


/*
 * If a node already has a real successor,
 * remaining alternatives are placed below
 * the real branch.
 */
const POTENTIAL_BRANCH_GAP = 40;


/*
 * Padding between potential groups and
 * other graph elements.
 */
const POTENTIAL_COLLISION_PADDING = 25;


/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeActionText(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase();
}


function getPotentialActionText(
  potentialAction
) {
  if (
    typeof potentialAction ===
    "string"
  ) {
    return potentialAction;
  }

  if (
    !potentialAction ||
    typeof potentialAction !==
      "object"
  ) {
    return "";
  }

  return (
    potentialAction.action ??
    potentialAction.action_type ??
    potentialAction.title ??
    potentialAction.description ??
    ""
  );
}


function rectanglesOverlap(
  a,
  b,
  padding = 0
) {
  return !(
    a.x +
      a.width +
      padding <=
      b.x ||

    b.x +
      b.width +
      padding <=
      a.x ||

    a.y +
      a.height +
      padding <=
      b.y ||

    b.y +
      b.height +
      padding <=
      a.y
  );
}


/*
 * =========================================================
 * MAIN COMPONENT
 * =========================================================
 */

function SimulatorApp() {
  const [
    graphData,
    setGraphData,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    cases,
    setCases,
  ] = useState([]);


  const [
    selectedCaseId,
    setSelectedCaseId,
  ] = useState(null);


  const [
    activeTab,
    setActiveTab,
  ] = useState("graph");


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


  const nodeTypes =
    useMemo(
      () => ({
        custom:
          CustomNode,

        potentialAction:
          PotentialActionNode,
      }),
      []
    );


  const edgeTypes =
    useMemo(
      () => ({
        custom:
          CustomEdge,

        potential:
          PotentialEdge,
      }),
      []
    );


  const [
    contextMenuRightClick,
    setContextMenuRightClick,
  ] = useState(null);


  const [
    detailsNode,
    setDetailsNode,
  ] = useState(null);


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


  const [
    processingPotentialAction,
    setProcessingPotentialAction,
  ] = useState(null);


  /*
   * =======================================================
   * CREATE CASE
   * =======================================================
   */

  const createCase_ =
    async (
      payload
    ) => {
      try {
        setIsProcessing(
          true
        );


        /*
         * 1. Create case + initial node
         */
        const creationResult =
          await createCase(
            payload
          );


        const newCase =
          creationResult.case;


        const initialNodeId =
          creationResult
            .initial_node_id;


        setCases(
          (
            previousCases
          ) => [
            ...previousCases,
            newCase,
          ]
        );


        setSelectedCaseId(
          newCase.id
        );


        setIsProcessing(
          false
        );


        /*
         * 2. Legal check
         */
        setIsLegalCheck(
          true
        );


        await legalCheck(
          newCase.id,
          initialNodeId
        );


        setIsLegalCheck(
          false
        );


        /*
         * 3. Generate possible actions
         */
        await addPossibleActions(
          newCase.id,
          initialNodeId
        );


        /*
         * 4. Reload graph
         */
        const updatedGraph =
          await fetchGraph(
            newCase.id
          );


        setGraphData(
          updatedGraph
        );


        return creationResult;

      } catch (err) {
        console.error(
          "Case creation workflow failed:",
          err
        );

        throw err;

      } finally {
        setIsProcessing(
          false
        );

        setIsLegalCheck(
          false
        );
      }
    };


  /*
   * =======================================================
   * LOAD CASES
   * =======================================================
   */

  const loadCases =
    async () => {
      try {
        const defaultOwnerId =
          "111";


        const data =
          await fetchCases(
            defaultOwnerId
          );


        setCases(
          data
        );


        if (
          data.length > 0 &&
          !selectedCaseId
        ) {
          setSelectedCaseId(
            data[0].id
          );
        }

      } catch (err) {
        console.error(
          err
        );
      }
    };


  /*
   * =======================================================
   * LOAD GRAPH
   * =======================================================
   */

  const loadGraph =
    async () => {
      if (
        !selectedCaseId
      ) {
        setGraphData(
          null
        );

        return;
      }


      try {
        setLoading(
          true
        );


        const data =
          await fetchGraph(
            selectedCaseId
          );


        setGraphData(
          data
        );

      } catch (err) {
        console.error(
          err
        );

      } finally {
        setLoading(
          false
        );
      }
    };


  /*
   * =======================================================
   * ADD NORMAL NODE
   * =======================================================
   */

  const handleAdd =
    async (
      nodeId
    ) => {
      try {
        setIsProcessing(
          true
        );


        setProcessingNodeId(
          nodeId
        );


        setContextMenuRightClick(
          null
        );


        console.log(
          "Adding node",
          nodeId
        );


        const newBranch =
          await addNode(
            selectedCaseId,
            nodeId
          );


        setIsProcessing(
          false
        );


        /*
         * Legal check
         */
        setIsLegalCheck(
          true
        );


        await legalCheck(
          selectedCaseId,
          newBranch.node.id
        );


        setIsLegalCheck(
          false
        );


        /*
         * Generate actions and artifacts
         */
        setIsCreatingArtifacts(
          true
        );


        await addPossibleActions(
          selectedCaseId,
          newBranch.node.id
        );


        await createArtifacts(
          selectedCaseId,
          newBranch.edge.id
        );


        setIsCreatingArtifacts(
          false
        );


        await loadGraph();

      } catch (err) {
        console.error(
          err
        );

      } finally {
        setIsProcessing(
          false
        );


        setIsLegalCheck(
          false
        );


        setIsCreatingArtifacts(
          false
        );


        setProcessingNodeId(
          null
        );
      }
    };


  /*
   * =======================================================
   * ADD NODE BY POTENTIAL ACTION
   * =======================================================
   */

  const handleAddByAction =
    async (
      nodeId,
      action
    ) => {
      const cleanedAction =
        String(
          action ?? ""
        ).trim();


      if (
        !cleanedAction
      ) {
        return;
      }


      const processingKey =
        `${nodeId}::${cleanedAction}`;


      try {
        setProcessingPotentialAction(
          processingKey
        );


        setProcessingNodeId(
          nodeId
        );


        setIsProcessing(
          true
        );


        setContextMenuRightClick(
          null
        );


        console.log(
          "Adding node by action",
          nodeId,
          cleanedAction
        );


        const newBranch =
          await addNodeByAction(
            selectedCaseId,
            nodeId,
            cleanedAction
          );


        setIsProcessing(
          false
        );


        /*
         * Legal check
         */
        setIsLegalCheck(
          true
        );


        await legalCheck(
          selectedCaseId,
          newBranch.node.id
        );


        setIsLegalCheck(
          false
        );


        /*
         * Generate possible actions
         * and artifacts for new state.
         */
        setIsCreatingArtifacts(
          true
        );


        await addPossibleActions(
          selectedCaseId,
          newBranch.node.id
        );


        await createArtifacts(
          selectedCaseId,
          newBranch.edge.id
        );


        setIsCreatingArtifacts(
          false
        );


        /*
         * Reload actual persisted graph.
         *
         * The clicked virtual action will
         * then be replaced by the real branch.
         */
        await loadGraph();

      } catch (err) {
        console.error(
          err
        );

      } finally {
        setIsProcessing(
          false
        );


        setIsLegalCheck(
          false
        );


        setIsCreatingArtifacts(
          false
        );


        setProcessingNodeId(
          null
        );


        setProcessingPotentialAction(
          null
        );
      }
    };


  /*
   * =======================================================
   * DEACTIVATE
   * =======================================================
   */

  const handleDeactivate =
    (
      nodeId
    ) => {
      console.log(
        "Deactivate node:",
        nodeId
      );


      setContextMenuRightClick(
        null
      );
    };


  /*
   * =======================================================
   * DELETE
   * =======================================================
   */

  const handleDelete =
    async (
      nodeId
    ) => {
      try {
        setContextMenuRightClick(
          null
        );


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


        setDetailsNode(
          null
        );


        setSelectedNodeId(
          null
        );


        setSelectedNodeData(
          null
        );


        setSelectedSidebarStats(
          null
        );


        await loadGraph();

      } catch (err) {
        console.error(
          err
        );
      }
    };


  /*
   * =======================================================
   * RIGHT CLICK
   * =======================================================
   */

  const onNodeContextMenuRightClick =
    (
      event,
      node
    ) => {
      event.preventDefault();


      /*
       * Potential actions are not
       * actual persisted graph nodes.
       */
      if (
        node.type ===
        "potentialAction"
      ) {
        return;
      }


      setContextMenuRightClick({
        x:
          event.clientX,

        y:
          event.clientY,

        nodeId:
          node.id,

        potentialNextStates:
          node.data?.state
            ?.potential_next_states ??
          [],
      });
    };


  /*
   * =======================================================
   * TAB CHANGE
   * =======================================================
   */

  const handleTabChange =
    (
      nextTab
    ) => {
      setActiveTab(
        nextTab
      );


      setContextMenuRightClick(
        null
      );


      if (
        nextTab !==
        "graph"
      ) {
        setDetailsNode(
          null
        );
      }
    };


  /*
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(
    () => {
      loadCases();
    },
    []
  );


  /*
   * =======================================================
   * SELECTED CASE CHANGE
   * =======================================================
   */

  useEffect(
    () => {
      setSelectedNodeId(
        null
      );


      setSelectedNodeData(
        null
      );


      setSelectedSidebarStats(
        null
      );


      setDetailsNode(
        null
      );


      if (
        selectedCaseId
      ) {
        loadGraph();
      }

    },
    [
      selectedCaseId,
    ]
  );


  /*
   * =======================================================
   * SELECTED PATH
   * =======================================================
   */

  const highlightedPath =
    useMemo(
      () => {
        const nodeIds =
          new Set();


        const edgeIds =
          new Set();


        if (
          !graphData ||
          !selectedNodeId
        ) {
          return {
            nodeIds,
            edgeIds,
          };
        }


        const graphNodes =
          graphData.nodes ??
          {};


        const graphEdges =
          graphData.edges ??
          {};


        let currentNodeId =
          selectedNodeId;


        const visitedNodeIds =
          new Set();


        while (
          currentNodeId &&
          !visitedNodeIds.has(
            currentNodeId
          )
        ) {
          visitedNodeIds.add(
            currentNodeId
          );


          nodeIds.add(
            currentNodeId
          );


          const currentNode =
            graphNodes[
              currentNodeId
            ];


          if (
            !currentNode
          ) {
            break;
          }


          const incomingEdgeId =
            currentNode
              .incoming?.[0];


          if (
            !incomingEdgeId
          ) {
            break;
          }


          const incomingEdge =
            graphEdges[
              incomingEdgeId
            ];


          if (
            !incomingEdge
          ) {
            break;
          }


          edgeIds.add(
            incomingEdgeId
          );


          currentNodeId =
            incomingEdge
              .source_id;
        }


        return {
          nodeIds,
          edgeIds,
        };
      },
      [
        graphData,
        selectedNodeId,
      ]
    );


  /*
   * =======================================================
   * CREATE REACT FLOW GRAPH
   * =======================================================
   */

  const {
    nodes,
    edges,
  } = useMemo(
    () => {
      if (
        !graphData
      ) {
        return {
          nodes: [],
          edges: [],
        };
      }


      const rawNodes =
        Object.values(
          graphData.nodes ??
          {}
        );


      const rawEdges =
        Object.values(
          graphData.edges ??
          {}
        );


      /*
       * ===================================================
       * 1. REAL NODES
       * ===================================================
       */

      const realFlowNodes =
        rawNodes.map(
          (
            node
          ) => {
            const isOnSelectedPath =
              highlightedPath
                .nodeIds
                .has(
                  node.id
                );


            const isSelected =
              node.id ===
              selectedNodeId;


            return {
              id:
                node.id,

              type:
                "custom",

              data:
                node,

              position: {
                x: 0,
                y: 0,
              },

              className: [
                isOnSelectedPath
                  ? "selected-path-node"
                  : "",

                isSelected
                  ? "selected-path-node-current"
                  : "",
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                ),
            };
          }
        );


      /*
       * ===================================================
       * 2. REAL EDGES
       * ===================================================
       */

      const realFlowEdges =
        rawEdges.map(
          (
            edge
          ) => {
            const isOnSelectedPath =
              highlightedPath
                .edgeIds
                .has(
                  edge.id
                );


            return {
              id:
                edge.id,

              source:
                edge.source_id,

              target:
                edge.target_id,

              type:
                "custom",

              data:
                edge,

              className:
                isOnSelectedPath
                  ? "selected-path-edge"
                  : "",

              animated:
                isOnSelectedPath,

              style: {
                stroke:
                  "#c08497",

                strokeWidth:
                  isOnSelectedPath
                    ? 3
                    : 2,

                filter:
                  isOnSelectedPath
                    ? "drop-shadow(0 0 5px rgba(156, 88, 102, 0.65))"
                    : "none",
              },
            };
          }
        );


      /*
       * ===================================================
       * 3. LAYOUT REAL GRAPH ONLY
       * ===================================================
       */

      const layoutedRealGraph =
        layoutGraph(
          realFlowNodes,
          realFlowEdges
        );


      const realNodeById =
        new Map(
          layoutedRealGraph
            .nodes
            .map(
              (
                node
              ) => [
                node.id,
                node,
              ]
            )
        );


      /*
       * ===================================================
       * 4. COLLISION RECTANGLES FOR REAL NODES
       * ===================================================
       *
       * We deliberately use a larger collision height than
       * Dagre itself because CustomNode can grow vertically.
       */

      const realNodeRectangles =
        layoutedRealGraph
          .nodes
          .map(
            (
              node
            ) => ({
              x:
                node.position.x,

              y:
                node.position.y,

              width:
                REAL_NODE_WIDTH,

              height:
                REAL_NODE_COLLISION_HEIGHT,
            })
          );


      /*
       * Track already placed potential groups.
       */
      const occupiedPotentialGroups =
        [];


      const potentialNodes =
        [];


      const potentialEdges =
        [];


      /*
       * ===================================================
       * 5. BUILD POTENTIAL ACTION FRONTIER
       * ===================================================
       */

      rawNodes.forEach(
        (
          rawNode
        ) => {
          const sourceNode =
            realNodeById.get(
              rawNode.id
            );


          if (
            !sourceNode
          ) {
            return;
          }


          const potentialNextStates =
            rawNode.state
              ?.potential_next_states ??
            [];


          if (
            !Array.isArray(
              potentialNextStates
            ) ||
            potentialNextStates.length ===
              0
          ) {
            return;
          }


          /*
           * Real outgoing branches from this state.
           */
          const outgoingRealEdges =
            rawEdges.filter(
              (
                edge
              ) =>
                edge.source_id ===
                rawNode.id
            );


          /*
           * Which possible actions have already
           * become actual graph branches?
           */
          const existingOutgoingActions =
            new Set(
              outgoingRealEdges
                .map(
                  (
                    edge
                  ) =>
                    normalizeActionText(
                      edge.action_type
                    )
                )
                .filter(
                  Boolean
                )
            );


          /*
           * Keep only unexpanded possibilities.
           */
          const remainingActions =
            potentialNextStates
              .map(
                (
                  potentialAction,
                  originalIndex
                ) => ({
                  action:
                    getPotentialActionText(
                      potentialAction
                    ),

                  originalIndex,
                })
              )
              .filter(
                ({
                  action,
                }) =>
                  Boolean(
                    action
                  )
              )
              .filter(
                ({
                  action,
                }) =>
                  !existingOutgoingActions
                    .has(
                      normalizeActionText(
                        action
                      )
                    )
              );


          if (
            remainingActions.length ===
            0
          ) {
            return;
          }


          /*
           * Total vertical height of this group.
           */
          const groupHeight =
            remainingActions.length *
              POTENTIAL_NODE_HEIGHT +

            Math.max(
              0,
              remainingActions.length -
                1
            ) *
              POTENTIAL_NODE_GAP;


          /*
           * groupX needs to be mutable because
           * nodes with an existing real successor
           * use a different placement strategy.
           */
          let groupX =
            sourceNode.position.x +
            POTENTIAL_X_OFFSET;


          let groupY;


          /*
           * =================================================
           * SOURCE ALREADY HAS REAL SUCCESSOR(S)
           * =================================================
           *
           * The remaining alternatives are deliberately
           * placed BELOW the existing real branch.
           */

          if (
            outgoingRealEdges.length >
            0
          ) {
            let lowestRelevantBottom =
              sourceNode.position.y +
              REAL_NODE_COLLISION_HEIGHT;


            outgoingRealEdges.forEach(
              (
                edge
              ) => {
                const targetNode =
                  realNodeById.get(
                    edge.target_id
                  );


                if (
                  !targetNode
                ) {
                  return;
                }


                const targetBottom =
                  targetNode.position.y +
                  REAL_NODE_COLLISION_HEIGHT;


                lowestRelevantBottom =
                  Math.max(
                    lowestRelevantBottom,
                    targetBottom
                  );
              }
            );


            /*
             * Vertical placement:
             *
             * safely below the complete successor branch.
             */
            groupY =
              lowestRelevantBottom +
              POTENTIAL_BRANCH_GAP;


            /*
             * Horizontal placement:
             *
             * keep remaining options relatively close to
             * the originating state rather than putting
             * them underneath the successor card.
             */
            groupX =
              sourceNode.position.x +
              REAL_NODE_WIDTH +
              80;
          }


          /*
           * =================================================
           * SOURCE HAS NO REAL SUCCESSOR
           * =================================================
           *
           * This is the frontier of the graph.
           *
           * Center the possibilities vertically around
           * their source node.
           */

          else {
            const sourceCenterY =
              sourceNode.position.y +
              REAL_NODE_COLLISION_HEIGHT /
                2;


            groupY =
              sourceCenterY -
              groupHeight /
                2;
          }


          /*
           * =================================================
           * COLLISION AVOIDANCE
           * =================================================
           */

          let groupRectangle = {
            x:
              groupX,

            y:
              groupY,

            width:
              POTENTIAL_NODE_WIDTH,

            height:
              groupHeight,
          };


          let collisionFound =
            true;


          let safetyCounter =
            0;


          while (
            collisionFound &&
            safetyCounter <
              100
          ) {
            safetyCounter +=
              1;


            collisionFound =
              false;


            const allOccupiedRectangles =
              [
                ...realNodeRectangles,
                ...occupiedPotentialGroups,
              ];


            for (
              const occupiedRectangle
              of allOccupiedRectangles
            ) {
              if (
                rectanglesOverlap(
                  groupRectangle,
                  occupiedRectangle,
                  POTENTIAL_COLLISION_PADDING
                )
              ) {
                /*
                 * Move the whole potential-action group
                 * below the object it overlaps.
                 */
                groupY =
                  occupiedRectangle.y +
                  occupiedRectangle.height +
                  POTENTIAL_COLLISION_PADDING;


                groupRectangle = {
                  ...groupRectangle,

                  y:
                    groupY,
                };


                collisionFound =
                  true;


                /*
                 * Restart checking from the beginning
                 * because this new position may collide
                 * with another node/group.
                 */
                break;
              }
            }
          }


          /*
           * Remember occupied area for subsequent groups.
           */
          occupiedPotentialGroups.push(
            groupRectangle
          );


          /*
           * =================================================
           * CREATE INDIVIDUAL ACTION NODES
           * =================================================
           */

          remainingActions.forEach(
            (
              {
                action,
                originalIndex,
              },
              displayIndex
            ) => {
              const virtualNodeId =
                `potential-action-${rawNode.id}-${originalIndex}`;


              const virtualEdgeId =
                `potential-edge-${rawNode.id}-${originalIndex}`;


              const processingKey =
                `${rawNode.id}::${action}`;


              const isThisActionProcessing =
                processingPotentialAction ===
                processingKey;


              const actionY =
                groupY +
                displayIndex *
                  (
                    POTENTIAL_NODE_HEIGHT +
                    POTENTIAL_NODE_GAP
                  );


              /*
               * Frontend-only virtual node.
               */
              potentialNodes.push({
                id:
                  virtualNodeId,

                type:
                  "potentialAction",

                data: {
                  sourceNodeId:
                    rawNode.id,

                  action,

                  isProcessing:
                    isThisActionProcessing,

                  isPotentialAction:
                    true,
                },

                position: {
                  x:
                    groupX,

                  y:
                    actionY,
                },

                selectable:
                  false,

                draggable:
                  false,

                focusable:
                  false,
              });


              /*
               * Frontend-only virtual edge.
               */
              potentialEdges.push({
                id:
                  virtualEdgeId,

                source:
                  rawNode.id,

                target:
                  virtualNodeId,

                type:
                  "potential",

                data: {
                  action,

                  sourceNodeId:
                    rawNode.id,

                  isPotential:
                    true,
                },

                selectable:
                  false,

                focusable:
                  false,
              });
            }
          );
        }
      );


      /*
       * ===================================================
       * 6. COMBINE REAL GRAPH + VISUAL FRONTIER
       * ===================================================
       */

      return {
        nodes: [
          ...layoutedRealGraph.nodes,
          ...potentialNodes,
        ],

        edges: [
          ...layoutedRealGraph.edges,
          ...potentialEdges,
        ],
      };
    },
    [
      graphData,
      highlightedPath,
      selectedNodeId,
      processingPotentialAction,
    ]
  );


  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div
      style={{
        height:
          "100vh",

        width:
          "100vw",

        display:
          "flex",

        flexDirection:
          "column",

        overflow:
          "hidden",

        background:
          "linear-gradient(180deg, #faf7f8 0%, #f3edef 100%)",
      }}
    >
      <TopBar
        cases={
          cases
        }

        selectedCaseId={
          selectedCaseId
        }

        onSelectCase={
          setSelectedCaseId
        }

        onCreateCase={() =>
          setCreateCaseModalOpen(
            true
          )
        }

        activeTab={
          activeTab
        }

        onTabChange={
          handleTabChange
        }
      />


      <div
        style={{
          display:
            "flex",

          flex:
            1,

          minWidth:
            0,

          minHeight:
            0,

          overflow:
            "hidden",
        }}
      >
        {activeTab ===
          "graph" && (
          <>
            <aside
              style={{
                flexShrink:
                  0,

                width:
                  "20vw",

                minWidth:
                  250,

                borderRight:
                  "1px solid #c08497",

                background:
                  "#140d10",

                overflowY:
                  "auto",
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
                flex:
                  1,

                minWidth:
                  0,

                height:
                  "100%",

                position:
                  "relative",
              }}
            >
              <ReactFlowProvider>
                <ReactFlow
                  nodes={
                    nodes
                  }

                  edges={
                    edges
                  }

                  nodeTypes={
                    nodeTypes
                  }

                  edgeTypes={
                    edgeTypes
                  }

                  fitView

                  onNodeContextMenu={
                    onNodeContextMenuRightClick
                  }

                  onPaneClick={() => {
                    setSelectedNodeId(
                      null
                    );


                    setSelectedNodeData(
                      null
                    );


                    setSelectedSidebarStats(
                      null
                    );


                    setDetailsNode(
                      null
                    );


                    setContextMenuRightClick(
                      null
                    );
                  }}

                  onMoveStart={() => {
                    setContextMenuRightClick(
                      null
                    );
                  }}

                  onNodeClick={
                    async (
                      event,
                      node
                    ) => {
                      /*
                       * Potential action:
                       *
                       * Create corresponding real node.
                       */
                      if (
                        node.type ===
                        "potentialAction"
                      ) {
                        if (
                          node.data
                            ?.isProcessing
                        ) {
                          return;
                        }


                        await handleAddByAction(
                          node.data
                            .sourceNodeId,

                          node.data
                            .action
                        );


                        return;
                      }


                      /*
                       * Normal persisted graph node.
                       */
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


                        setDetailsNode(
                          data
                        );


                        const stats =
                          await fetchSidebarStats(
                            selectedCaseId,
                            node.id
                          );


                        setSelectedSidebarStats(
                          stats
                        );

                      } catch (err) {
                        console.error(
                          err
                        );
                      }
                    }
                  }

                  proOptions={{
                    hideAttribution:
                      true,
                  }}
                >
                  <MiniMap
                    nodeColor={(
                      node
                    ) => {
                      if (
                        node.type ===
                        "potentialAction"
                      ) {
                        return "#eadde0";
                      }


                      return "#c08497";
                    }}
                  />


                  <Controls />


                  <Background
                    color="#e7d6da"
                    gap={24}
                  />
                </ReactFlow>


                <NodeDetailsPanel
                  node={
                    detailsNode
                  }

                  onClose={() =>
                    setDetailsNode(
                      null
                    )
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

                      onAdd={
                        handleAdd
                      }

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


        {activeTab ===
          "documents" && (
          <DocumentsView
            caseId={
              selectedCaseId
            }
          />
        )}


        {activeTab ===
          "actors" && (
          <main
            style={{
              flex:
                1,

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              background:
                "linear-gradient(180deg, #faf7f8 0%, #f3edef 100%)",

              color:
                "#756b6f",
            }}
          >
            <div
              style={{
                textAlign:
                  "center",
              }}
            >
              <h2
                style={{
                  margin:
                    "0 0 8px",

                  color:
                    "#443b3e",
                }}
              >
                Actors
              </h2>


              <p
                style={{
                  margin:
                    0,
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
        open={
          createCaseModalOpen
        }

        onClose={() =>
          setCreateCaseModalOpen(
            false
          )
        }

        onCreate={
          async (
            payload
          ) => {
            console.log(
              "CREATE CASE PAYLOAD",
              payload
            );


            return createCase_(
              payload
            );
          }
        }
      />
    </div>
  );
}


export default SimulatorApp;