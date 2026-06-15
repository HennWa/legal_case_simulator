export async function legalCheck(nodeId: string) {
  const res = await fetch(
    `http://localhost:8000/api/legal_check/${nodeId}`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to check node ${nodeId}`);
  }

  return res.json();
}