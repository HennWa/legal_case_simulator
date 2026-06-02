export async function fetchNode(nodeId: string) {
  const res = await fetch(
    `http://localhost:8000/api/node/${nodeId}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch node ${nodeId}`);
  }

  return res.json();
}