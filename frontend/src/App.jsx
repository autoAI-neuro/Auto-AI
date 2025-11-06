import React, { useState } from "react";
import { getHealth, getVersion } from "./api";

export default function App() {
  const [health, setHealth] = useState(null);
  const [version, setVersion] = useState(null);

  const checkHealth = async () => setHealth(await getHealth());
  const checkVersion = async () => setVersion(await getVersion());

  return (
    <div style={{ fontFamily: "Arial", padding: "2rem", color: "white", backgroundColor: "#1e1e1e", height: "100vh" }}>
      <h1>🚀 AUTOAI Dashboard</h1>
      <button onClick={checkHealth}>Check Health</button>
      <button onClick={checkVersion} style={{ marginLeft: "10px" }}>Check Version</button>

      {health && <div style={{ marginTop: "20px" }}><strong>Health:</strong> {JSON.stringify(health)}</div>}
      {version && <div style={{ marginTop: "10px" }}><strong>Version:</strong> {JSON.stringify(version)}</div>}
    </div>
  );
}
