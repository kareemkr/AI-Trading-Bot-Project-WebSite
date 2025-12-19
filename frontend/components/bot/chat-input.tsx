"use client";

import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    onSend(message.trim());
    setMessage("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [message]);

  return (
    <div className="bg-gradient-to-t from-background via-background to-transparent pt-4 pb-4 px-6">
      <div className="relative flex items-end gap-2 bg-card/60 backdrop-blur-xl border border-white/5 rounded-[1.8rem] p-2.5 shadow-2xl shadow-black/20 focus-within:border-accent/30 focus-within:ring-1 focus-within:ring-accent/10 transition-all">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="NEURAL_COMMAND_INPUT"
          className="flex-1 resize-none bg-transparent border-0 outline-none text-base px-3 py-1.5 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.3em] placeholder:text-muted-foreground/50"
          rows={1}
        />

        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="h-11 w-11 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 disabled:opacity-40 transition-all"
        >
          <ArrowUp className="h-5 w-5 stroke-[2.5px]" />
        </button>
      </div>
    </div>
  );
}
