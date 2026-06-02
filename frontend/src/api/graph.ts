export async function fetchGraph() {
  const res = await fetch("http://localhost:8000/api/graph");

  if (!res.ok) {
    throw new Error("Failed to fetch graph");
  }

  return res.json();
}