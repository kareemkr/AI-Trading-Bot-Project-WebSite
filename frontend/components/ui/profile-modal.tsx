"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, Shield, Clock, LogOut, Camera, Edit2, Check, X, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export function ProfileModal({ open, onClose, onUpgrade }: ProfileModalProps) {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          setUser(u);
          setNewName(u.name || "");
          setNewAvatar(u.avatar || null);
        } catch (e) {
          console.error("Failed to parse user", e);
        }
      }
      setIsEditing(false);
    }
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast.info("Session Terminated", { description: "You have been securely logged out." });
    window.location.href = "/";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch("http://localhost:8000/auth/update", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                name: newName,
                avatar: newAvatar
            })
        });

        if (!res.ok) throw new Error("Update failed");
        
        const data = await res.json();
        const updatedUser = { ...user, name: data.name, avatar: data.avatar };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        toast.success("Identity Verified!", { description: "Your profile details have been updated." });
        setIsEditing(false);
    } catch (e) {
        toast.error("Failed to update profile");
        console.error(e);
    } finally {
        setIsSaving(false);
    }
  };

  if (!user) return null;

  const status = user.subscription_status?.toLowerCase();
  const isPremium = status === "pro" || status === "elite";
  const isElite = status === "elite" || status === "pro";
  
  const planName = isElite ? "Elite Executive" : "Free Explorer";
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-3xl border border-white/10 shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] p-0 overflow-hidden outline-none rounded-[2.5rem]">
        <DialogTitle className="sr-only">User Profile</DialogTitle>
        <DialogDescription className="sr-only">Account management and settings</DialogDescription>
        
        {/* Header Banner */}
        <div className={`h-40 ${isPremium ? "bg-accent/20" : "bg-white/5"} relative flex items-center justify-center overflow-hidden`}>
            {/* Animated Mesh */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,var(--accent)_0%,transparent_70%)] animate-pulse" />
            
            <div className="z-10 text-center relative group">
                {/* Futuristic Avatar */}
                 <div className={`w-28 h-28 rounded-[2rem] mx-auto border-4 border-card shadow-2xl flex items-center justify-center text-4xl font-black mb-2 relative overflow-hidden transition-all duration-500 scale-100 group-hover:scale-105 ${isPremium ? "bg-accent/10 text-accent border-accent/20 shadow-accent/20" : "bg-muted text-muted-foreground border-white/5"}`}>
                    {newAvatar ? (
                        <img src={newAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        user.name?.[0]?.toUpperCase() || "T"
                    )}
                    
                    {isEditing && (
                        <div 
                            className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                    )}
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            {/* Actions */}
            <div className="absolute top-6 right-6 flex gap-2">
               {!isEditing ? (
                   <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all"
                   >
                       <Edit2 className="w-4 h-4" />
                   </button>
               ) : (
                   <>
                       <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-all">
                           <X className="w-4 h-4" />
                       </button>
                       <button onClick={handleSave} disabled={isSaving} className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 transition-all">
                           <Check className="w-4 h-4" />
                       </button>
                   </>
               )}
            </div>
        </div>

        <div className="px-8 pb-8 pt-12 relative -mt-6 bg-card border-t border-white/10 rounded-t-[3rem] shadow-inner">
            {/* Status Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                 <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl flex items-center gap-2 border ${isElite ? "bg-accent text-accent-foreground border-white/20" : (isPremium ? "bg-white/10 text-white border-white/10" : "bg-muted text-muted-foreground border-white/5")}`}>
                    {isElite ? <Star className="w-3.5 h-3.5 fill-current" /> : <Shield className="w-3.5 h-3.5" />}
                    {planName}
                 </div>
            </div>

            <div className="text-center mb-10">
                {isEditing ? (
                    <input 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)} 
                        className="text-center font-black text-2xl bg-white/5 border border-white/10 rounded-2xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" 
                    />
                ) : (
                    <h2 className="text-3xl font-black text-white tracking-tighter">{user.name || "Trader"}</h2>
                )}
                <p className="text-sm text-muted-foreground font-bold font-mono mt-2 opacity-50 uppercase tracking-widest">{user.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Zap className="w-5 h-5 fill-accent" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Protocol</p>
                    <p className="text-sm font-bold text-white mt-1">Trading v4.2</p>
                </div>

                <div className="bg-white/5 p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Shield className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Security</p>
                    <p className="text-sm font-bold text-white mt-1">Encrypted</p>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
                 <button 
                  onClick={handleLogout}
                  className="p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500 rounded-2xl transition-all group"
                  title="Logout Session"
                 >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                 </button>

                 {!isElite ? (
                    <button 
                        className="flex-1 py-4 bg-accent text-accent-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 hover:shadow-accent/40 active:scale-95 transition-all"
                        onClick={() => {
                            onClose();
                            onUpgrade?.();
                        }}
                    >
                        {status === 'pro' ? 'Upgrade to Elite' : 'Unlock Full Suite'}
                    </button>
                ) : (
                    <button 
                        className="flex-1 py-4 bg-white/5 text-white/40 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest cursor-not-allowed"
                        disabled
                    >
                        Elite System Active
                    </button>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
