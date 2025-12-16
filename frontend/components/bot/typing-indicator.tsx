"use client";

import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 w-full">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary" />
      </div>

      <div className="bg-card border rounded-2xl px-4 py-3 flex gap-1">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-150" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-300" />
      </div>
    </div>
  );
}
