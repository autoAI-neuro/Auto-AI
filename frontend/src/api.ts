export async function getHealth() {
  const res = await fetch("http://localhost:8000/health");
  return res.json();
}

export async function getVersion() {
  const res = await fetch("http://localhost:8000/api/version");
  return res.json();
}
