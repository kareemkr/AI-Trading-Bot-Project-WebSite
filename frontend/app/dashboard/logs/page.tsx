"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Shield, AlertTriangle, AlertCircle } from "lucide-react";

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  module: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/logs?limit=100");
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const getLevelBadge = (level: string) => {
    switch (level.toUpperCase()) {
      case "ERROR":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle size={12}/> ERROR</Badge>;
      case "WARN":
      case "WARNING":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex items-center gap-1"><AlertTriangle size={12}/> WARN</Badge>;
      default:
        return <Badge variant="outline" className="text-blue-400 border-blue-400/20 flex items-center gap-1"><Shield size={12}/> INFO</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Terminal className="text-blue-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Engine Logs</h1>
            <p className="text-muted-foreground text-sm">Real-time execution intelligence and audit trail</p>
          </div>
        </div>
        <button 
          onClick={fetchLogs}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
        >
          Refresh Now
        </button>
      </div>

      <Card className="border-white/5 bg-black/40 backdrop-blur-md">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="bg-white/5 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[100px]">Level</TableHead>
                  <TableHead className="w-[120px]">Module</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Initializing stream...</TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No logs found.</TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-white/5 border-white/5 font-mono text-xs">
                      <TableCell className="text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getLevelBadge(log.level)}
                      </TableCell>
                      <TableCell>
                        <span className="text-blue-400/80">{log.module || "CORE"}</span>
                      </TableCell>
                      <TableCell className="text-white/90">
                        {log.message}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
