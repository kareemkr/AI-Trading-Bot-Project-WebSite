"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";

export default function StatusCard() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(API_ENDPOINTS.BOT.STATUS);
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
