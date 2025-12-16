"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, Shield, Clock, LogOut, Camera, Edit2, Check, X } from "lucide-react";
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
    toast.success("Logged out successfully");
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
        const token = localStorage.getItem("token"); // Assuming you store token
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
        
        // Update local storage
        const updatedUser = { ...user, name: data.name, avatar: data.avatar };
        localStorage.setItem("user", JSON.stringify(updatedUser)); // Fix: Update the user object, not just name
        setUser(updatedUser);
        
        toast.success("Profile Updated!");
        setIsEditing(false);
    } catch (e) {
        toast.error("Failed to update profile");
        console.error(e);
    } finally {
        setIsSaving(false);
    }
  };

  if (!user) return null;

  const isPremium = user.subscription_status === "premium";
  const planName = isPremium ? "Elite Plan" : "Free Plan";
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl p-0 overflow-hidden outline-none">
        <DialogTitle className="sr-only">User Profile</DialogTitle>
        <DialogDescription className="sr-only">Manage your account settings</DialogDescription>
        
        {/* Header / Banner */}
        <div className={`h-36 ${isPremium ? "bg-black" : "bg-gray-100"} relative flex items-center justify-center overflow-hidden transition-colors duration-500`}>
            {isPremium && (
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 animate-pulse" />
            )}
            
            <div className="z-10 text-center relative group">
                {/* Avatar */}
                 <div className={`w-24 h-24 rounded-full mx-auto border-4 border-white shadow-xl flex items-center justify-center text-3xl font-bold mb-2 relative overflow-hidden ${isPremium ? "bg-gradient-to-tr from-yellow-400 to-orange-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                    {newAvatar ? (
                        <img src={newAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        user.name?.[0]?.toUpperCase() || "U"
                    )}
                    
                    {/* Camera Overlay */}
                    {isEditing && (
                        <div 
                            className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                    )}
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            {/* Edit Button (Top Right) */}
            <div className="absolute top-4 right-4">
               {!isEditing ? (
                   <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => setIsEditing(true)}>
                       <Edit2 className="w-4 h-4" />
                   </Button>
               ) : (
                   <div className="flex gap-2">
                       <Button variant="ghost" size="icon" className="text-red-400 hover:bg-white/20 rounded-full h-8 w-8" onClick={() => setIsEditing(false)}>
                           <X className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="text-green-400 hover:bg-white/20 rounded-full h-8 w-8" onClick={handleSave} disabled={isSaving}>
                           <Check className="w-4 h-4" />
                       </Button>
                   </div>
               )}
            </div>
        </div>

        <div className="px-6 pb-6 pt-12 relative -mt-4 bg-white rounded-t-3xl">
            {/* Status Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                 <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg flex items-center gap-1.5 ${isPremium ? "bg-gradient-to-r from-yellow-500 to-orange-600 ring-2 ring-white" : "bg-gray-500 ring-2 ring-white"}`}>
                    {isPremium ? <Shield className="w-3 h-3 fill-current" /> : null}
                    {planName}
                 </div>
            </div>

            <div className="text-center mb-8 mt-2">
                {isEditing ? (
                    <Input 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)} 
                        className="text-center font-bold text-lg h-9 border-b-2 border-primary/20 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-transparent px-0 w-2/3 mx-auto" 
                    />
                ) : (
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{user.name || "User"}</h2>
                )}
                <p className="text-sm text-gray-500 font-medium mt-1">{user.email}</p>
            </div>

            <div className="space-y-4">
                <div className="bg-gray-50/80 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 transition-transform hover:scale-[1.02] duration-300">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Status</p>
                        <p className="text-sm font-bold text-gray-900 capitalize">{user.subscription_status || "Free"}</p>
                    </div>
                    {isPremium && (
                         <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    )}
                </div>

                {isPremium && (
                    <div className="bg-gray-50/80 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 transition-transform hover:scale-[1.02] duration-300 delay-75">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Subscription</p>
                            <p className="text-sm font-bold text-gray-900">Lifetime Access</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 flex gap-3">
                {!isPremium ? (
                    <Button 
                        className="flex-1 bg-black text-white hover:bg-black/90 h-11 rounded-xl font-bold shadow-xl shadow-black/10 transition-all hover:translate-y-[-2px]"
                        onClick={() => {
                            onClose();
                            onUpgrade?.();
                        }}
                    >
                        Upgrade to Elite 🚀
                    </Button>
                ) : (
                    <Button variant="outline" className="flex-1 border-gray-200 bg-gray-50 hover:bg-gray-100 h-11 rounded-xl rounded-r-none font-semibold text-gray-600" disabled>
                        Manage Subscription
                    </Button>
                )}
                
                <Button 
                    variant="ghost" 
                    className={`h-11 rounded-xl ${isPremium ? "flex-1 border border-gray-200 rounded-l-none" : "w-14"} text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors`}
                    onClick={handleLogout}
                    title="Sign Out"
                >
                    <LogOut className="w-5 h-5" />
                    {isPremium && <span className="ml-2 font-semibold">Sign Out</span>}
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
