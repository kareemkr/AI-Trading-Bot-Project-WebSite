import BotControls from "./components/BotControls";
import StatusCard from "./components/StatusCard";
import Logs from "./components/Logs";

export default function Dashboard() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <StatusCard />
      <BotControls />
      <Logs />
    </div>
  );
}
"use client";

import { useEffect } from "react";

export default function DashboardPage() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/signin";
  }, []);

  return <div className="p-8">Welcome to your dashboard.</div>;
}
