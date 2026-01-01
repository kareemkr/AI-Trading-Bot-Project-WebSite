"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";

export default function Logs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await axios.get(API_ENDPOINTS.BOT.LOGS);
      setLogs(res.data.logs);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ marginTop: 30 }}>
      <h3>Logs</h3>
      <div
        style={{
          background: "#111",
          color: "lime",
          padding: 10,
          height: 300,
          overflowY: "scroll",
          borderRadius: 8
        }}
      >
        {logs.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
