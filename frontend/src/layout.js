import dagre from "dagre";


/*
 * IMPORTANT:
 *
 * These dimensions should correspond
 * to the actual rendered CustomNode.
 */
const NODE_WIDTH = 320;

/*
 * Conservative layout height for:
 *
 * - icon
 * - state number
 * - title up to 2 lines
 * - summary up to 4 lines
 * - badge
 * - padding
 */
const NODE_HEIGHT = 280;


export function layoutGraph(
  nodes,
  edges
) {
  const g =
    new dagre.graphlib.Graph();


  g.setDefaultEdgeLabel(
    () => ({})
  );


  g.setGraph({
    /*
     * Legal simulation flows
     * from left to right.
     */
    rankdir: "LR",

    /*
     * Horizontal distance between
     * actual state columns.
     */
    ranksep: 220,

    /*
     * Vertical distance between
     * real graph branches.
     */
    nodesep: 120,

    marginx: 40,

    marginy: 40,
  });


  /*
   * REAL GRAPH NODES ONLY
   */
  nodes.forEach(
    (
      node
    ) => {
      g.setNode(
        node.id,
        {
          width:
            NODE_WIDTH,

          height:
            NODE_HEIGHT,
        }
      );
    }
  );


  /*
   * REAL GRAPH EDGES ONLY
   */
  edges.forEach(
    (
      edge
    ) => {
      g.setEdge(
        edge.source,
        edge.target
      );
    }
  );


  dagre.layout(
    g
  );


  const layoutedNodes =
    nodes.map(
      (
        node
      ) => {
        const pos =
          g.node(
            node.id
          );


        return {
          ...node,

          position: {
            x:
              pos.x -
              NODE_WIDTH /
                2,

            y:
              pos.y -
              NODE_HEIGHT /
                2,
          },
        };
      }
    );


  return {
    nodes:
      layoutedNodes,

    edges,
  };
}