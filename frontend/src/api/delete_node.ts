export async function deleteNode(nodeId: string) {
  const res = await fetch(
    `http://localhost:8000/api/delete_node/${nodeId}`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to delete node ${nodeId}`);
  }

  return res.json();
}