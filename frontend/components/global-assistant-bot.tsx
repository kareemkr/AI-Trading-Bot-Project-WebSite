"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Minus, Loader2, Sparkles, User, Zap, MessageSquare, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { API_ENDPOINTS } from "@/lib/api";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export function GlobalAssistantBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch(API_ENDPOINTS.ASSISTANT.CHAT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: userMsg.content,
                    mode: "guide"
                })
            });
            const data = await res.json();

            if (res.ok) {
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: data.reply,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                throw new Error("Failed to fetch response");
            }
        } catch (e) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "I'm having trouble connecting right now. Please try again in a moment.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[380px] sm:w-[420px] h-[640px] bg-[#020817]/95 backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-[0_48px_128px_-32px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500 relative">
                    
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

                    {/* Header */}
                    <div className="px-8 py-7 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-emerald-500/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl">
                                    <BrainCircuit className="w-7 h-7 text-emerald-500" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#020817] p-0.5">
                                    <div className="w-full h-full rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-lg font-black uppercase tracking-tighter text-white/90">Neural Assistant</span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    Active Now
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shadow-inner"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scrollbar-none relative z-10">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 py-10">
                                <div className="relative">
                                    <div className="absolute -inset-8 bg-white/5 rounded-full blur-3xl" />
                                    <div className="relative w-28 h-28 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-2xl">
                                        <BrainCircuit className="w-12 h-12 text-white/20" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black tracking-tight text-white/80">How can I help you?</h3>
                                    <p className="text-xs text-white/30 font-bold uppercase tracking-widest max-w-[280px] leading-relaxed mx-auto">
                                        I can help you navigate the platform, explain features, or analyze market trends.
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex flex-col gap-2 max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-500", msg.role === "user" ? "ml-auto" : "")}>
                                <div className={cn(
                                    "px-6 py-4 rounded-[1.8rem] text-[15px] font-medium leading-relaxed shadow-xl",
                                    msg.role === "user" 
                                        ? "bg-accent text-accent-foreground font-black rounded-tr-sm" 
                                        : "bg-white/5 border border-white/10 text-white/80 rounded-tl-sm backdrop-blur-xl"
                                )}>
                                    {msg.content}
                                </div>
                                <span className={cn("text-[9px] font-black uppercase tracking-widest text-white/20 px-2", msg.role === "user" ? "text-right" : "text-left")}>
                                    {msg.role === "assistant" ? "System Protocol" : "User Request"}
                                </span>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex gap-2 max-w-[80%] animate-in fade-in transition-all">
                                <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/5 rounded-tl-sm flex items-center gap-1.5">
                                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-8 pb-10 relative z-10">
                        <div className="relative group bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-1.5 transition-all focus-within:bg-white/[0.05] focus-within:border-white/10 focus-within:shadow-[0_0_40px_-10px_rgba(0,0,0,1)]">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                                className="w-full bg-transparent border-none px-6 py-5 text-base text-white/90 focus:ring-0 placeholder:text-white/20 font-black uppercase tracking-tighter"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2.5 top-2.5 w-11 h-11 bg-emerald-500 text-[#020817] rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-20 shadow-lg shadow-emerald-500/20"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 fill-[#020817]" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative w-16 h-16 bg-[#020617] backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 hover:border-accent/40"
                >
                    <div className="absolute inset-0 bg-accent/20 rounded-[2rem] blur-lg group-hover:blur-xl transition-all" />
                    <div className="relative">
                        <MessageSquare className="w-7 h-7 text-white group-hover:scale-0 transition-transform duration-300 absolute inset-0" />
                        <BrainCircuit className="w-7 h-7 text-accent scale-0 group-hover:scale-100 transition-transform duration-300 transform" />
                    </div>
                    
                    {/* Notification Dot */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-[#020617] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                    </div>
                </button>
            )}
        </div>
    );
}
