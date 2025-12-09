"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const aiMsg = {
        role: "assistant",
        content: data.reply ?? "No response received.",
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Could not connect to server." },
      ]);
    }

    setInput("");
    setLoading(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10 text-accent">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">K-Trader AI</h1>
            <p className="text-sm text-muted-foreground">
              Your intelligent crypto trading companion
            </p>
          </div>
        </div>
      </header>

      {/* CHAT */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
            {/* MESSAGES */}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  m.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.role === "assistant"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <Bot className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`relative max-w-[75%] px-4 py-3 rounded-2xl ${
                    m.role === "assistant"
                      ? "bg-card border border-border rounded-tl-sm"
                      : "bg-accent text-accent-foreground rounded-tr-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* INPUT AREA */}
          <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-6 px-6">
            <div className="relative bg-card border border-border rounded-2xl shadow-lg shadow-black/5 focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20 transition-all overflow-hidden">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 200) + "px";
                }}
                onKeyDown={handleKey}
                placeholder="Ask your trading assistant..."
                rows={1}
                className="w-full px-4 py-4 pr-14 bg-transparent resize-none text-sm placeholder:text-muted-foreground focus:outline-none min-h-[56px] max-h-[200px]"
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="absolute right-3 bottom-3 p-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40 active:scale-95 hover:scale-105 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-3">
              Press Enter to send — Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
