export async function fetchGraph(caseId) {
  const res = await fetch(`http://localhost:8000/api/graph/${caseId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch graph");
  }

  return res.json();
}