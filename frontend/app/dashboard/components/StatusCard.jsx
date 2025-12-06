"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function StatusCard() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get("http://localhost:8000/bot/status");
        setStatus(res.data.running ? "Running" : "Stopped");
      } catch (error) {
        setStatus("Error");
      }
    }
    
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Bot Status: {status}</h3>
    </div>
  );
}
