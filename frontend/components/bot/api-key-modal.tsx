"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Rocket } from "lucide-react";

import { Slider } from "@/components/ui/slider";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apiKey: string, apiSecret: string, leverage: number) => void;
  isLoading: boolean;
}

export function ApiKeyModal({ isOpen, onClose, onSubmit, isLoading }: ApiKeyModalProps) {
  const [key, setKey] = useState("");
  const [secret, setSecret] = useState("");
  const [leverage, setLeverage] = useState([20]); // Default 20x

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key && secret) {
      onSubmit(key, secret, leverage[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border/50 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Connect Exchange
          </DialogTitle>
          <DialogDescription>
            Enter your Binance Futures API keys to start the bot.
            <br />
            <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded mt-1 inline-block">
              <Lock className="w-3 h-3 inline mr-1" />
              Keys are only stored in memory for this session.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter your API Key"
              required
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-secret">API Secret</Label>
            <Input
              id="api-secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter your API Secret"
              required
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
               <Label>Leverage</Label>
               <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">{leverage[0]}x</span>
            </div>
            <Slider
              value={leverage}
              onValueChange={setLeverage}
              max={121}
              min={1}
              step={1}
              className="py-2"
            />
            <p className="text-[10px] text-muted-foreground text-center">
              Higher leverage = Higher risk. Be careful.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !key || !secret}>
              {isLoading ? "Connecting..." : "Start Bot"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
