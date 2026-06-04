export async function addNode(nodeId: string) {
  const res = await fetch(
    `http://localhost:8000/api/add_node/${nodeId}`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to add node ${nodeId}`);
  }

  return res.json();
}