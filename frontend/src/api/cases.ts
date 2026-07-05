export async function fetchCases(ownerId: string) {
  const res = await fetch(`http://localhost:8000/api/cases/${ownerId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch cases");
  }

  return res.json();
}