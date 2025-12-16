"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

interface LogConsoleProps {
  logs: string[];
  autoTrading: boolean;
}

export function LogConsole({ logs, autoTrading }: LogConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }
  }, [logs]);

  const parseLog = (log: string) => {
    const timeMatch = log.match(/^\[(.*?)\]/);
    const timestamp = timeMatch ? timeMatch[1] : new Date().toLocaleTimeString();
    const content = log.replace(/^\[.*?\]\s*/, "");
    
    let type: "info" | "success" | "error" | "warning" = "info";
    if (content.toLowerCase().includes("error") || content.toLowerCase().includes("failed")) type = "error";
    else if (content.toLowerCase().includes("connect") || content.toLowerCase().includes("success")) type = "success";
    else if (content.toLowerCase().includes("warning")) type = "warning";
    
    return { timestamp, content, type };
  };

  return (
    <div className="hidden lg:flex w-80 flex-col bg-[#0c0c0c] border-l border-white/10 shadow-2xl">
      {/* Header */}
      <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-md ${autoTrading ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"} transition-colors`}>
                <Terminal className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-wide text-gray-200">System Logs</span>
        </div>
        
        <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${autoTrading ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" : "bg-red-500"}`} />
             <span className={`text-[10px] font-bold uppercase tracking-wider ${autoTrading ? "text-emerald-500" : "text-red-500"}`}>
                 {autoTrading ? "Live" : "Stop"}
             </span>
        </div>
      </div>

      {/* Log Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-3 font-mono text-[11px] leading-relaxed">
            {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-600 gap-2 opacity-60">
                    <Terminal className="w-8 h-8" />
                    <span>Waiting for system events...</span>
                </div>
            )}
            
            {logs.map((log, i) => {
                const { timestamp, content, type } = parseLog(log);
                
                let Icon = Info;
                let colorClass = "text-blue-400";
                let bgClass = "bg-blue-500/10 border-blue-500/20";
                
                if (type === "error") {
                    Icon = AlertCircle;
                    colorClass = "text-red-400";
                    bgClass = "bg-red-500/10 border-red-500/20";
                } else if (type === "success") {
                    Icon = CheckCircle;
                    colorClass = "text-emerald-400";
                    bgClass = "bg-emerald-500/10 border-emerald-500/20";
                } else if (type === "warning") {
                    Icon = AlertTriangle;
                    colorClass = "text-amber-400";
                    bgClass = "bg-amber-500/10 border-amber-500/20";
                }

                return (
                    <div key={i} className={`p-2.5 rounded-lg border ${bgClass} flex gap-3 group animate-in slide-in-from-left-2 fade-in duration-300`}>
                        <div className={`mt-0.5 opacity-70 ${colorClass}`}>
                            <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 opacity-50">
                                <span className="text-[10px] uppercase font-bold tracking-tight">{timestamp}</span>
                            </div>
                            <div className={`break-words font-medium ${type === "error" ? "text-red-200" : "text-gray-300"}`}>
                                {content}
                            </div>
                        </div>
                    </div>
                );
            })}
          </div>
      </ScrollArea>
    </div>
  );
}
