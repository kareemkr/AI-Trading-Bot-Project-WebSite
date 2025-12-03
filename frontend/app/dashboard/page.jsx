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
