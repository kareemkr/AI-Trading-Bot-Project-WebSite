"use client";

import { useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";

export default function BotControls() {
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      await axios.post(API_ENDPOINTS.BOT.START);
    } catch (error) {
      console.error("Failed to start bot:", error);
    } finally {
      setLoading(false);
    }
  };

  const stop = async () => {
    setLoading(true);
    try {
      await axios.post(API_ENDPOINTS.BOT.STOP);
    } catch (error) {
      console.error("Failed to stop bot:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <button type="button" onClick={start} disabled={loading}>
        Start Bot
      </button>
      <button
        type="button"
        onClick={stop}
        disabled={loading}
        style={{ marginLeft: 10 }}
      >
        Stop Bot
      </button>
    </div>
  );
}
