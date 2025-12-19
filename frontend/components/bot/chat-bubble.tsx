"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/5">
          <Bot className="w-5 h-5 text-accent" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] md:max-w-[75%] rounded-[1.5rem] px-5 py-4 shadow-xl backdrop-blur-md transition-all",
          isUser
            ? "bg-accent text-accent-foreground rounded-tr-sm shadow-accent/20"
            : "bg-card/80 border border-white/5 rounded-tl-sm shadow-black/20"
        )}
      >
        <div className={cn(
            "prose prose-sm max-w-none leading-relaxed",
            isUser ? "prose-invert font-bold" : "prose-invert opacity-90"
        )}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {timestamp && (
          <p
            className={cn(
              "text-[9px] mt-2 font-black uppercase tracking-widest opacity-40",
              isUser ? "text-accent-foreground" : "text-muted-foreground"
            )}
          >
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center shadow-lg">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
