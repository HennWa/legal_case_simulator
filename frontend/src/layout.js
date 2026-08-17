import dagre from "dagre";


const nodeWidth = 320;
const nodeHeight = 160;


export function layoutGraph(
  nodes,
  edges
) {
  const g =
    new dagre.graphlib.Graph();

  g.setDefaultEdgeLabel(
    () => ({})
  );


  /*
   * IMPORTANT:
   *
   * This function now lays out ONLY
   * actual persisted graph nodes.
   *
   * Potential actions must NOT be
   * passed into this function.
   */
  g.setGraph({
    rankdir: "LR",

    /*
     * Horizontal distance between
     * actual legal states.
     */
    ranksep: 220,

    /*
     * Vertical distance between
     * real branches.
     */
    nodesep: 120,

    marginx: 40,
    marginy: 40,
  });


  /*
   * REAL NODES
   */
  nodes.forEach(
    (node) => {
      g.setNode(
        node.id,
        {
          width:
            nodeWidth,

          height:
            nodeHeight,
        }
      );
    }
  );


  /*
   * REAL EDGES
   */
  edges.forEach(
    (edge) => {
      g.setEdge(
        edge.source,
        edge.target
      );
    }
  );


  dagre.layout(g);


  const layoutedNodes =
    nodes.map(
      (node) => {
        const pos =
          g.node(node.id);

        return {
          ...node,

          position: {
            x:
              pos.x -
              nodeWidth / 2,

            y:
              pos.y -
              nodeHeight / 2,
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