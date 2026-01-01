"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Shield, AlertTriangle, AlertCircle, PieChart, Activity, Zap } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  module: string;
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'scanner' | 'heatmap' | 'bubbles'>('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // LOGS LOGIC
  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.SYSTEM.LOGS}?limit=100`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'heatmap') {
      // Clear previous widget
      const container = document.getElementById("tv-heatmap-container");
      if (container) {
          container.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-white/20 text-xs font-bold uppercase tracking-widest pointer-events-none">Loading Institutional Heatmap...</div>';
          const script = document.createElement("script");
          script.src = "https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js";
          script.async = true;
          script.innerHTML = JSON.stringify({
            "dataSource": "Crypto",
            "blockSize": "market_cap_calc",
            "blockColor": "change",
            "locale": "en",
            "symbolUrl": "",
            "colorTheme": "dark",
            "hasTopBar": false,
            "isDataSetEnabled": false,
            "isZoomEnabled": true,
            "hasSymbolTooltip": true,
            "isTransparent": true,
            "width": "100%",
            "height": "100%"
          });
          container.appendChild(script);
      }
    } else if (activeTab === 'scanner') {
        const container = document.getElementById("tv-screener-container");
        if (container) {
            container.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-white/20 text-xs font-bold uppercase tracking-widest pointer-events-none">Loading Market Scanner...</div>';
            const script = document.createElement("script");
            script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
            script.async = true;
            script.innerHTML = JSON.stringify({
                "width": "100%",
                "height": "100%",
                "defaultColumn": "overview",
                "screener_type": "crypto_mkt",
                "displayCurrency": "USD",
                "colorTheme": "dark",
                "locale": "en",
                "isTransparent": true
            });
            container.appendChild(script);
        }
    } else if (activeTab === 'logs') {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }
  }, [activeTab]);

  const getLevelBadge = (level: string) => {
    switch (level.toUpperCase()) {
      case "ERROR":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle size={12}/> ERROR</Badge>;
      case "WARN":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex items-center gap-1"><AlertTriangle size={12}/> WARN</Badge>;
      default:
        return <Badge variant="outline" className="text-blue-400 border-blue-400/20 flex items-center gap-1"><Shield size={12}/> INFO</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#030706] text-white overflow-hidden">
        {/* HEADER & TABS */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                    {activeTab === 'logs' && <Terminal className="w-6 h-6 text-accent" />}
                    {activeTab === 'bubbles' && <Activity className="w-6 h-6 text-accent" />}
                    {activeTab === 'heatmap' && <PieChart className="w-6 h-6 text-accent" />}
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Neural Analytics Hub</h1>
                    <p className="text-xs font-medium text-white/40 tracking-wider">
                        {activeTab === 'logs' && "SYSTEM AUDIT TRAIL // REAL-TIME"}
                        {activeTab === 'scanner' && "DEEP MARKET SCANNER // INSTITUTIONAL"}
                        {activeTab === 'heatmap' && "TOTAL MARKET HEATMAP // VISUALIZATION"}
                        {activeTab === 'bubbles' && "INTERACTIVE MARKET BUBBLES // ALPHA"}
                    </p>
                </div>
            </div>

            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                {[
                    { id: 'logs', label: 'System Logs', icon: Terminal },
                    { id: 'scanner', label: 'Scanner', icon: Activity },
                    { id: 'heatmap', label: 'Heat Map', icon: PieChart },
                    { id: 'bubbles', label: 'Bubbles', icon: Zap },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                            activeTab === tab.id 
                                ? "bg-accent/20 text-accent shadow-lg shadow-accent/10 border border-accent/20" 
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 relative overflow-hidden bg-[#030706]">
            
            {/* LOGS TAB */}
            {activeTab === 'logs' && (
                <div className="h-full p-8 animate-fade-in-slow overflow-y-auto custom-scrollbar">
                    <Card className="border-white/5 bg-black/40 backdrop-blur-md h-full flex flex-col">
                        <CardHeader className="border-b border-white/5 py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                    Execution Stream
                                </CardTitle>
                                <span className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/5 text-white/30 font-mono">
                                    LIVE_CONNECTION: STABLE
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-white/5 sticky top-0 z-10 backdrop-blur-lg">
                                        <TableRow className="hover:bg-transparent border-white/5">
                                            <TableHead className="w-[180px] text-xs font-bold text-white/50">TIMESTAMP</TableHead>
                                            <TableHead className="w-[100px] text-xs font-bold text-white/50">LEVEL</TableHead>
                                            <TableHead className="w-[150px] text-xs font-bold text-white/50">MODULE</TableHead>
                                            <TableHead className="text-xs font-bold text-white/50">MESSAGE</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-white/5 border-white/5 font-mono text-xs group transition-colors">
                                                <TableCell className="text-white/30 group-hover:text-white/50 transition-colors">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </TableCell>
                                                <TableCell>{getLevelBadge(log.level)}</TableCell>
                                                <TableCell>
                                                    <span className="text-accent/60 group-hover:text-accent transition-colors">{log.module || "CORE_ENGINE"}</span>
                                                </TableCell>
                                                <TableCell className="text-white/70 group-hover:text-white transition-colors">
                                                    {log.message}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* SCANNER TAB */}
            {activeTab === 'scanner' && (
                <div className="w-full h-full animate-fade-in-slow p-6">
                    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black relative" id="tv-screener-container">
                        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs font-bold uppercase tracking-widest pointer-events-none">
                            Loading Market Scanner...
                        </div>
                    </div>
                </div>
            )}

            {/* BUBBLES TAB */}
            {activeTab === 'bubbles' && (
                <div className="w-full h-full animate-fade-in-slow p-6">
                    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#030706]">
                        <iframe 
                            src="https://cryptobubbles.net/" 
                            className="w-full h-full border-none"
                        />
                    </div>
                </div>
            )}

            {/* HEATMAP TAB */}
            {activeTab === 'heatmap' && (
                <div className="w-full h-full animate-fade-in-slow p-6">
                    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black relative" id="tv-heatmap-container">
                        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs font-bold uppercase tracking-widest pointer-events-none">
                            Loading Institutional Heatmap...
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
