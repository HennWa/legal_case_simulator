import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from "reactflow";

import "reactflow/dist/style.css";

import "./App.css";

import {
  useApiClient,
} from "./api/useApiClient";

import {
  isNodeLimitReachedError,
} from "./api/apiClient";

import CustomNode from "./AppComponents/CustomNode";
import CustomEdge from "./AppComponents/CustomEdge";

import PotentialActionNode from "./AppComponents/PotentialActionNode";
import PotentialEdge from "./AppComponents/PotentialEdge";

import Sidebar from "./AppComponents/Sidebar";

import ContextMenuRightClick from "./AppComponents/ContextMenuRightClick";

import NodeDetailsPanel from "./AppComponents/NodeDetailsPanel/NodeDetailsPanel";

import TopBar from "./AppComponents/TopBar";

import CreateCaseModal from "./AppComponents/CreateCaseModal/CreateCaseModal";

import NodeLimitModal from "./AppComponents/NodeLimitModal/NodeLimitModal";

import DocumentsView from "./AppComponents/DocumentsView/DocumentsView";

import {
  layoutGraph,
} from "./layout";

import {
  fetchCases,
} from "./api/cases";

import {
  createCase,
} from "./api/create_case";

import {
  fetchNode,
} from "./api/node";

import {
  fetchGraph,
} from "./api/graph";

import {
  fetchSidebarStats,
} from "./api/sidebar_stats";

import {
  addNode,
} from "./api/add_node";

import {
  addNodeByAction,
} from "./api/add_node_by_action";

import {
  deleteNode,
} from "./api/delete_node";

import {
  legalCheck,
} from "./api/legal_check";

import {
  createArtifacts,
} from "./api/create_artifacts";

import {
  addPossibleActions,
} from "./api/add_possible_actions";


/*
 * =========================================================
 * GRAPH DIMENSIONS
 * =========================================================
 */

/*
 * MUST match:
 *
 * CustomNode.jsx
 * layout.js
 */
const REAL_NODE_WIDTH = 320;


/*
 * Because the real node text is now clamped,
 * this can be much closer to the actual maximum
 * node height.
 */
const REAL_NODE_COLLISION_HEIGHT =
  280;


/*
 * MUST match PotentialActionNode.jsx.
 */
const POTENTIAL_NODE_WIDTH =
  160;

const POTENTIAL_NODE_HEIGHT =
  34;


/*
 * Used only if there is NO later
 * real graph column.
 */
const POTENTIAL_X_OFFSET =
  430;


/*
 * Compact vertical spacing.
 */
const POTENTIAL_NODE_GAP =
  20;


const POTENTIAL_BRANCH_GAP =
  40;


const POTENTIAL_COLLISION_PADDING =
  25;


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


  return String(
    value
  )
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

  const apiFetch =
    useApiClient();


  /*
   * =======================================================
   * STATE
   * =======================================================
   */

  const [
    graphData,
    setGraphData,
  ] = useState(
    null
  );


  const [
    loading,
    setLoading,
  ] = useState(
    true
  );


  const [
    cases,
    setCases,
  ] = useState(
    []
  );


  const [
    selectedCaseId,
    setSelectedCaseId,
  ] = useState(
    null
  );


  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "graph"
  );


  const [
    selectedNodeId,
    setSelectedNodeId,
  ] = useState(
    null
  );


  const [
    selectedNodeData,
    setSelectedNodeData,
  ] = useState(
    null
  );


  const [
    selectedSidebarStats,
    setSelectedSidebarStats,
  ] = useState(
    null
  );


  const [
    contextMenuRightClick,
    setContextMenuRightClick,
  ] = useState(
    null
  );


  const [
    detailsNode,
    setDetailsNode,
  ] = useState(
    null
  );


  const [
    createCaseModalOpen,
    setCreateCaseModalOpen,
  ] = useState(
    false
  );


  /*
   * Contains the structured backend
   * node-limit error detail.
   *
   * null means that the modal is closed.
   */
  const [
    nodeLimitUsage,
    setNodeLimitUsage,
  ] = useState(
    null
  );


  const [
    isProcessing,
    setIsProcessing,
  ] = useState(
    false
  );


  const [
    isLegalCheck,
    setIsLegalCheck,
  ] = useState(
    false
  );


  const [
    isCreatingArtifacts,
    setIsCreatingArtifacts,
  ] = useState(
    false
  );


  const [
    processingNodeId,
    setProcessingNodeId,
  ] = useState(
    null
  );


  const [
    processingPotentialAction,
    setProcessingPotentialAction,
  ] = useState(
    null
  );


  /*
   * =======================================================
   * REACT FLOW TYPES
   * =======================================================
   */

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


  /*
   * =======================================================
   * NODE LIMIT ERROR
   * =======================================================
   */

  const handlePossibleNodeLimitError =
    (
      error
    ) => {
      if (
        !isNodeLimitReachedError(
          error
        )
      ) {
        return false;
      }


      setNodeLimitUsage(
        error.detail
      );


      /*
       * Make sure the context menu is
       * gone when the modal appears.
       */
      setContextMenuRightClick(
        null
      );


      return true;
    };


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


        const creationResult =
          await createCase(
            apiFetch,
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
         * Legal check
         */
        setIsLegalCheck(
          true
        );


        await legalCheck(
          apiFetch,
          newCase.id,
          initialNodeId
        );


        setIsLegalCheck(
          false
        );


        /*
         * Generate possible actions.
         */
        await addPossibleActions(
          apiFetch,
          newCase.id,
          initialNodeId
        );


        /*
         * Reload.
         */
        const updatedGraph =
          await fetchGraph(
            apiFetch,
            newCase.id
          );


        setGraphData(
          updatedGraph
        );


        return creationResult;

      } catch (
        err
      ) {
        /*
         * The initial case node also
         * counts against the user's
         * node quota.
         */
        if (
          handlePossibleNodeLimitError(
            err
          )
        ) {
          /*
           * Re-throw because CreateCaseModal
           * awaits this function.
           *
           * CreateCaseModal should ignore
           * this particular error because
           * SimulatorApp shows the dedicated
           * NodeLimitModal.
           */
          throw err;
        }


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
        const data =
          await fetchCases(
            apiFetch
          );


        setCases(
          data
        );


        if (
          data.length >
            0 &&
          !selectedCaseId
        ) {
          setSelectedCaseId(
            data[0].id
          );
        }

      } catch (
        err
      ) {
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
            apiFetch,
            selectedCaseId
          );


        setGraphData(
          data
        );

      } catch (
        err
      ) {
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
            apiFetch,
            selectedCaseId,
            nodeId
          );


        setIsProcessing(
          false
        );


        setIsLegalCheck(
          true
        );


        await legalCheck(
          apiFetch,
          selectedCaseId,
          newBranch.node.id
        );


        setIsLegalCheck(
          false
        );


        setIsCreatingArtifacts(
          true
        );


        await addPossibleActions(
          apiFetch,
          selectedCaseId,
          newBranch.node.id
        );


        await createArtifacts(
          apiFetch,
          selectedCaseId,
          newBranch.edge.id
        );


        setIsCreatingArtifacts(
          false
        );


        await loadGraph();

      } catch (
        err
      ) {
        if (
          handlePossibleNodeLimitError(
            err
          )
        ) {
          return;
        }


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
   * ADD NODE BY ACTION
   * =======================================================
   */

  const handleAddByAction =
    async (
      nodeId,
      action
    ) => {
      const cleanedAction =
        String(
          action ??
          ""
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
            apiFetch,
            selectedCaseId,
            nodeId,
            cleanedAction
          );


        setIsProcessing(
          false
        );


        setIsLegalCheck(
          true
        );


        await legalCheck(
          apiFetch,
          selectedCaseId,
          newBranch.node.id
        );


        setIsLegalCheck(
          false
        );


        setIsCreatingArtifacts(
          true
        );


        await addPossibleActions(
          apiFetch,
          selectedCaseId,
          newBranch.node.id
        );


        await createArtifacts(
          apiFetch,
          selectedCaseId,
          newBranch.edge.id
        );


        setIsCreatingArtifacts(
          false
        );


        await loadGraph();

      } catch (
        err
      ) {
        if (
          handlePossibleNodeLimitError(
            err
          )
        ) {
          return;
        }


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
          apiFetch,
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

      } catch (
        err
      ) {
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
       * REAL NODES
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
       * REAL EDGES
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
       * LAYOUT REAL GRAPH ONLY
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
       * COLLISION RECTANGLES
       * ===================================================
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


      const occupiedPotentialGroups =
        [];


      const potentialNodes =
        [];


      const potentialEdges =
        [];


      /*
       * ===================================================
       * POTENTIAL ACTIONS
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


          const outgoingRealEdges =
            rawEdges.filter(
              (
                edge
              ) =>
                edge.source_id ===
                rawNode.id
            );


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
           * =================================================
           * HORIZONTAL POSITION
           * =================================================
           */

          let groupX =
            sourceNode.position.x +
            POTENTIAL_X_OFFSET;


          const nextRealNode =
            layoutedRealGraph
              .nodes
              .filter(
                (
                  node
                ) =>
                  node.position.x >
                  sourceNode.position.x
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  a.position.x -
                  b.position.x
              )[0];


          if (
            nextRealNode
          ) {
            const sourceCenterX =
              sourceNode.position.x +
              REAL_NODE_WIDTH /
                2;


            const nextCenterX =
              nextRealNode.position.x +
              REAL_NODE_WIDTH /
                2;


            const midpointX =
              (
                sourceCenterX +
                nextCenterX
              ) /
              2;


            groupX =
              midpointX -
              POTENTIAL_NODE_WIDTH /
                2;
          }


          /*
           * =================================================
           * VERTICAL POSITION
           * =================================================
           */

          let groupY;


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


            groupY =
              lowestRelevantBottom +
              POTENTIAL_BRANCH_GAP;
          }


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
                 * Only move vertically.
                 * Horizontal midpoint remains
                 * unchanged.
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


                break;
              }
            }
          }


          occupiedPotentialGroups.push(
            groupRectangle
          );


          /*
           * =================================================
           * CREATE POTENTIAL NODES / EDGES
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


                      try {
                        const data =
                          await fetchNode(
                            apiFetch,
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
                            apiFetch,
                            selectedCaseId,
                            node.id
                          );


                        setSelectedSidebarStats(
                          stats
                        );

                      } catch (
                        err
                      ) {
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


                {
                  contextMenuRightClick &&
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
                        contextMenuRightClick
                          .potentialNextStates
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
                  )
                }


                {
                  isProcessing &&
                  (
                    <div className="loading-indicator">
                      <div className="spinner" />

                      <span>
                        creating next step...
                      </span>
                    </div>
                  )
                }


                {
                  isLegalCheck &&
                  (
                    <div className="loading-indicator">
                      <div className="spinner" />

                      <span>
                        legal check...
                      </span>
                    </div>
                  )
                }


                {
                  isCreatingArtifacts &&
                  (
                    <div className="loading-indicator">
                      <div className="spinner" />

                      <span>
                        creating documents...
                      </span>
                    </div>
                  )
                }
              </ReactFlowProvider>
            </div>
          </>
        )}


        {
          activeTab ===
            "documents" &&
          (
            <DocumentsView
              caseId={
                selectedCaseId
              }
            />
          )
        }


        {
          activeTab ===
            "actors" &&
          (
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
          )
        }
      </div>


      {/*
       * ===================================================
       * CREATE CASE MODAL
       * ===================================================
       */}

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


      {/*
       * ===================================================
       * NODE LIMIT MODAL
       * ===================================================
       */}

      <NodeLimitModal
        open={
          nodeLimitUsage !==
          null
        }

        usage={
          nodeLimitUsage
        }

        onClose={() =>
          setNodeLimitUsage(
            null
          )
        }
      />
    </div>
  );
}


export default SimulatorApp;