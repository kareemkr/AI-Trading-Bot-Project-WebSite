"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Minus, Loader2, Sparkles, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

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
            const res = await fetch("http://localhost:8000/assistant/chat", {
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
                content: "⚠️ Neural Link unstable. Unable to reach AI Core.",
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
                <div className="w-[350px] sm:w-[380px] h-[500px] bg-black/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 bg-accent/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center relative">
                                <Bot className="w-5 h-5 text-accent" />
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black uppercase italic tracking-tighter text-white">Neural Assistant</span>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Online • v4.2</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-white transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                                <Bot className="w-12 h-12 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground font-medium max-w-[200px]">
                                    Direct link to Neural Core established. Ask about market trends, signals, or platform help.
                                </p>
                            </div>
                        )}
                        
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex gap-3 max-w-[90%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                                    msg.role === "user" ? "bg-white/10 border-white/10" : "bg-accent/10 border-accent/20"
                                )}>
                                    {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Zap className="w-4 h-4 text-accent" />}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl text-xs font-medium leading-relaxed",
                                    msg.role === "user" 
                                        ? "bg-white text-black font-semibold rounded-tr-sm" 
                                        : "bg-white/5 border border-white/10 text-white rounded-tl-sm"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex gap-3 max-w-[90%]">
                                <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                                </div>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-lg">
                        <div className="relative group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a command..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-accent/40 transition-colors shadow-inner"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-accent text-accent-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative w-14 h-14 bg-accent rounded-full shadow-[0_0_20px_rgba(61,214,140,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:animate-ping duration-1000" />
                    <Bot className="w-7 h-7 text-accent-foreground group-hover:rotate-12 transition-transform" />
                    
                    {/* Notification Dot */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </div>
                </button>
            )}
        </div>
    );
}
