"use client";

import axios from "axios";

export default function BotControls() {
  const start = async () => {
    await axios.post("http://localhost:8000/bot/start");
  };

  const stop = async () => {
    await axios.post("http://localhost:8000/bot/stop");
  };

  return (
    <div style={{ marginTop: 20 }}>
      <button onClick={start}>Start Bot</button>
      <button onClick={stop} style={{ marginLeft: 10 }}>
        Stop Bot
      </button>
    </div>
  );
}
