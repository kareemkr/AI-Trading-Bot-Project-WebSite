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
                <div className="w-[360px] sm:w-[400px] h-[600px] bg-[#020617]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 relative group">
                    {/* Background Noise & Glow */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px] -z-10" />

                    {/* Header */}
                    <div className="p-5 border-b border-white/5 flex items-center justify-between relative z-10 bg-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-emerald-500/10 border border-white/10 flex items-center justify-center shadow-lg shadow-accent/10">
                                    <BrainCircuit className="w-6 h-6 text-accent" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#020617]"></span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-black uppercase italic tracking-tighter text-white">Neural Assistant</span>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"/>
                                    Active Now
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all hover:rotate-90"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
                                <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center rotate-3 relative overflow-hidden group/icon">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500" />
                                    <BrainCircuit className="w-10 h-10 text-white/50 group-hover/icon:text-accent transition-colors duration-500" />
                                </div>
                                <div className="space-y-2 max-w-[240px]">
                                    <h3 className="text-white font-bold tracking-tight">How can I help you?</h3>
                                    <p className="text-xs text-white/40 font-medium leading-relaxed">
                                        I can help you navigate the platform, explain features, or analyze market trends.
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex gap-3 max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-lg",
                                    msg.role === "user" ? "bg-white text-black border-white" : "bg-black/40 border-white/10"
                                )}>
                                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-accent" />}
                                </div>
                                <div className={cn(
                                    "p-4 rounded-3xl text-base font-medium leading-relaxed shadow-sm relative overflow-hidden",
                                    msg.role === "user" 
                                        ? "bg-accent text-black font-semibold rounded-tr-sm" 
                                        : "bg-white/5 border border-white/10 text-gray-100 rounded-tl-sm backdrop-blur-md"
                                )}>
                                    {/* Subtle sheen for user messages */}
                                    {msg.role === "user" && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />}
                                    <div className="relative z-10">{msg.content}</div>
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex gap-3 max-w-[90%] animate-in fade-in slide-in-from-bottom-2">
                                <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                                </div>
                                <div className="p-4 rounded-3xl bg-white/5 border border-white/10 rounded-tl-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none absolute bottom-0 left-0 right-0 h-32 z-0" />
                    
                    <div className="p-4 relative z-20">
                        <div className="group relative rounded-[2rem] p-1 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 shadow-2xl transition-all focus-within:border-accent/30 focus-within:shadow-accent/10 focus-within:bg-black/80">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your message..."
                                    className="w-full bg-transparent border-none rounded-full px-5 py-4 text-lg text-white focus:ring-0 placeholder:text-white/20 font-medium"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 p-3 bg-accent text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
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
