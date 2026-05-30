import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
} from "reactflow";

import "reactflow/dist/style.css";

import graphData from "./data/graph.json";

function App() {
  const { nodes, edges } = useMemo(() => {
    const rawNodes = Object.values(graphData.nodes);
    const rawEdges = Object.values(graphData.edges);

    // simple automatic layout
    const flowNodes = rawNodes.map((node, index) => ({
      id: node.id,
      position: {
        x: index * 350,
        y: 100,
      },
      data: {
        label: (
          <div style={{ padding: 10 }}>
            <strong>{node.title}</strong>

            <div style={{ marginTop: 8, fontSize: 12 }}>
              {node.summary}
            </div>

            <div
              style={{
                marginTop: 8,
                background: "#f5f5f5",
                padding: 6,
                borderRadius: 6,
                fontSize: 11,
              }}
            >
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {JSON.stringify(node.state, null, 2)}
              </pre>
            </div>
          </div>
        ),
      },
      style: {
        width: 280,
        border: "1px solid #ccc",
        borderRadius: 12,
        padding: 4,
        background: "white",
      },
    }));

    const flowEdges = rawEdges.map((edge) => ({
      id: edge.id,
      source: edge.source_id,
      target: edge.target_id,
      label: `${edge.action_type} (${edge.probability})`,
      animated: true,
    }));

    return {
      nodes: flowNodes,
      edges: flowEdges,
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

export default App;