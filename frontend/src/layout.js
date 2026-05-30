import dagre from "dagre";

const nodeWidth = 320;
const nodeHeight = 160;

export function layoutGraph(nodes, edges) {
  const g = new dagre.graphlib.Graph();

  g.setDefaultEdgeLabel(() => ({}));

  // 🔥 Left-to-right flow (correct for legal reasoning chains)
  g.setGraph({
    rankdir: "LR",

    // 📏 spacing improvements (this is what you were missing)
    ranksep: 220,
    nodesep: 80,
    marginx: 40,
    marginy: 40,
  });

  // Nodes
  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  // Edges
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);

    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}