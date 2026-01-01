"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LogConsoleProps {
  logs: string[];
  autoTrading: boolean;
  variant?: 'sidebar' | 'full';
  title?: string;
}

export function LogConsole({ logs, autoTrading, variant = 'sidebar', title = "Neural Interpreter_V4" }: LogConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const parseLog = (log: string) => {
    const timeMatch = log.match(/^\[(.*?)\]/);
    const timestamp = timeMatch ? timeMatch[1] : new Date().toLocaleTimeString();
    const rawContent = log.replace(/^\[.*?\]\s*/, "");
    
    let type: "info" | "success" | "error" | "warning" | "neural" = "info";
    let content = rawContent;

    if (rawContent.toLowerCase().includes("error") || rawContent.toLowerCase().includes("failed")) {
        type = "error";
    } else if (rawContent.toLowerCase().includes("analyze") || rawContent.toLowerCase().includes("neural") || rawContent.toLowerCase().includes("scanning")) {
        type = "neural";
    } else if (rawContent.toLowerCase().includes("success") || rawContent.toLowerCase().includes("established") || rawContent.toLowerCase().includes("ready")) {
        type = "success";
    } else if (rawContent.toLowerCase().includes("warning")) {
        type = "warning";
    }
    
    return { timestamp, content, type };
  };

  return (
    <div className={cn(
        "flex flex-col transition-all duration-500 h-full",
        variant === 'sidebar' 
            ? "hidden lg:flex w-80 bg-[#0c0c0c] border-l border-white/10 shadow-2xl" 
            : "w-full bg-[#020617] relative overflow-hidden"
    )}>
      {/* Background Glow for Full-screen variant */}
      {variant === 'full' && (
          <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-accent/5 rounded-full blur-[150px] opacity-40 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] opacity-30" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent z-10" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
          </div>
      )}

      {/* Persistent Terminal Header */}
      <div className={cn(
          "h-16 px-8 border-b border-white/5 flex items-center justify-between backdrop-blur-3xl relative z-30",
          variant === 'full' ? "bg-white/[0.01]" : "bg-white/5"
      )}>
        <div className="flex items-center gap-4">
            <div className={cn(
                "p-2 rounded-xl border transition-all duration-500",
                autoTrading ? "bg-accent/10 border-accent/20 text-accent shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-white/5 border-white/10 text-white/30"
            )}>
                <Terminal className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="font-black text-[11px] uppercase tracking-[0.3em] text-white">{title}</span>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                   <div className={cn("w-1.5 h-1.5 rounded-full", autoTrading ? "bg-accent animate-pulse" : "bg-red-500")} />
                   System Status: {autoTrading ? "Live_Execution" : "Standby"}
                </span>
            </div>
        </div>
      </div>

      <ScrollArea className="flex-1 relative z-10 no-scrollbar" ref={scrollRef}>
          <div className={cn(
              "p-8 space-y-4 font-mono leading-relaxed max-w-6xl mx-auto pb-32",
              variant === 'full' ? "text-[13px]" : "text-[11px]"
          )}>
            {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[50vh] text-white/10 gap-4 opacity-50">
                    <Terminal className="w-12 h-12" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Awaiting Execution Pulse...</span>
                </div>
            )}
            
            {logs.map((log, i) => {
                const { timestamp, content, type } = parseLog(log);
                
                let colorClass = "text-white/40";
                let accentColor = "transparent";

                if (type === "error") {
                    colorClass = "text-red-400";
                    accentColor = "rgba(239,68,68,0.1)";
                } else if (type === "success") {
                    colorClass = "text-emerald-400";
                    accentColor = "rgba(16,185,129,0.1)";
                } else if (type === "neural") {
                    colorClass = "text-accent";
                    accentColor = "rgba(16,185,129,0.05)";
                } else if (type === "warning") {
                    colorClass = "text-yellow-400";
                    accentColor = "rgba(234,179,8,0.1)";
                }

                return (
                    <div key={i} className={cn(
                        "group flex gap-6 transition-all duration-300 relative py-2 rounded-lg",
                        variant === 'full' ? "hover:bg-white/[0.02]" : ""
                    )}>
                        <div className="flex flex-col items-center flex-shrink-0 pt-1">
                             <span className="text-[8px] font-black text-white/10 group-hover:text-white/30 transition-colors uppercase tracking-widest">{timestamp}</span>
                             <div className={cn("w-[2px] h-full mt-2 rounded-full", type === 'neural' ? "bg-accent/20" : "bg-white/5")} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <span className={cn(
                                "font-bold tracking-tight transform transition-all duration-300 block",
                                colorClass,
                                type === 'neural' ? "italic text-white" : ""
                            )}>
                                <span className="opacity-20 mr-4 select-none italic">{i.toString().padStart(3, '0')}</span>
                                {content}
                            </span>
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} className="h-4" />
          </div>
      </ScrollArea>
    </div>
  );
}
