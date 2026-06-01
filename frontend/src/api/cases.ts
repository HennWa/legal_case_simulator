export async function fetchCases() {
  const res = await fetch("http://localhost:8000/api/cases");

  if (!res.ok) {
    throw new Error("Failed to fetch cases");
  }

  return res.json();
}