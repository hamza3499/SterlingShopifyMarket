"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Settings, LogOut, Crown, Copy, ChevronRight, HelpCircle,
  User, Lock, MessageSquare, Gift, Activity, Camera, CreditCard,
  ShieldCheck, Sparkles, Check
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BottomNav from "@/components/layout/BottomNav";

export default function Profile() {
  const router = useRouter();
  const { user, token, logout, setUser } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, historyRes] = await Promise.all([
        api.get("/user/profile"),
        api.get("/user/tasks"),
      ]);
      setUser(profileRes.data.data);
      setTasks(historyRes.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Session error");
      logout(); router.push("/login");
    } finally { setLoading(false); }
  };

  const copyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Invite code copied");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadRes.data.success) {
        const imageUrl = uploadRes.data.url;
        const updateRes = await api.put('/user/avatar', { avatar: imageUrl });
        
        if (updateRes.data.success) {
          setUser({ ...user, avatar: imageUrl } as any);
          toast.success("Avatar updated successfully");
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.response?.data?.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const menuItems = [
    { icon: Lock, label: "Trust and Security", path: "/security" },
    { icon: CreditCard, label: "Wallet Address", path: "/wallet-address" },
    { icon: MessageSquare, label: "Support Chat", path: "/dashboard?chat=true" },
    { icon: HelpCircle, label: "FAQs", path: "/faq" },
    { icon: Settings, label: "Company Profile", path: "/platform-profile" },
  ];

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-bg pb-32 font-sans relative overflow-hidden">
      {/* Ambient Glow Orbs */}
      <div className="luxury-bg-orb w-[500px] h-[500px] -top-40 -left-32 bg-blue-300/30" />
      <div className="luxury-bg-orb w-[400px] h-[400px] top-1/3 -right-32 bg-sky-200/40" style={{ animationDelay: "3s" }} />

      {/* Top Divider */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

      {/* Header */}
      <header className="px-6 pt-8 pb-5 flex items-center justify-between relative z-10">
        <button 
          onClick={() => router.back()} 
          className="h-11 w-11 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center shadow-sm text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-all"
        >
          <ArrowLeft size={20} strokeWidth={2.25} />
        </button>

        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Official Member</p>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Profile & Account</h1>
        </div>

        <div className="w-11" />
      </header>

      <main className="px-5 space-y-6 relative z-10">
        {/* ========================================================
            1. ROYAL BLUE METALLIC USER IDENTITY HERO CARD
           ======================================================== */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] p-7 text-white relative overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(145deg, #0A1435 0%, #112560 45%, #1D4ED8 100%)",
            border: "1px solid rgba(147, 197, 253, 0.35)",
            boxShadow: "0 22px 55px rgba(15, 23, 42, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
          }}
        >
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-52 h-52 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-5 mb-7 relative z-10">
            {/* Avatar Ring */}
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <div 
                onClick={handleAvatarClick}
                className="h-20 w-20 rounded-[26px] overflow-hidden flex items-center justify-center cursor-pointer relative group border-2 border-white/40 shadow-xl"
                style={{ 
                  background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #38BDF8 100%)",
                }}
              >
                {uploading ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Camera size={22} className="text-white" />
                  </div>
                )}
                
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={38} className="text-white" />
                )}
              </div>

              {/* Camera Icon Badge */}
              <div 
                onClick={handleAvatarClick}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-xl bg-white text-blue-600 flex items-center justify-center cursor-pointer shadow-md border border-blue-200 hover:scale-110 transition-transform"
              >
                <Camera size={13} strokeWidth={2.5} />
              </div>
            </div>

            {/* Username & VIP Tier */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate mb-1.5">
                {user.username}
              </h2>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 backdrop-blur-md shadow-sm">
                <Crown size={13} className="text-amber-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">
                  VIP Level {user.vipLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-2 gap-3.5 relative z-10">
            <div className="p-4 rounded-2xl bg-black/25 border border-white/12 backdrop-blur-md shadow-inner">
              <p className="text-[9.5px] font-black uppercase tracking-widest text-blue-200/80 mb-1">
                Balance
              </p>
              <p className="text-xl font-black text-white tabular-nums">
                ${(user.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/25 border border-white/12 backdrop-blur-md shadow-inner">
              <p className="text-[9.5px] font-black uppercase tracking-widest text-blue-200/80 mb-1">
                Commission
              </p>
              <p className="text-xl font-black text-emerald-400 tabular-nums">
                +${(user.totalCommission ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ========================================================
            2. REFERRAL CODE VAULT CARD (SOFT BLUE WHITE GRADIENT)
           ======================================================== */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="luxury-card-soft-blue rounded-[30px] p-6 sm:p-7 relative overflow-hidden shadow-xl border border-blue-200/80"
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-[10.5px] font-black uppercase tracking-[0.25em] text-[#1E3A8A]">
              Referral Code
            </p>
            <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Invite & Earn
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0A1435] border border-blue-400/30 shadow-inner flex items-center justify-between gap-3">
            <p className="text-base sm:text-lg font-mono font-black text-[#38BDF8] tracking-[0.3em] truncate pl-2">
              {user.inviteCode || "—"}
            </p>
            <button 
              type="button"
              onClick={() => copyCode(user.inviteCode || "")}
              className="btn-blue text-[10px] font-black px-4 py-3 rounded-xl shadow-md shrink-0 flex items-center gap-1.5"
            >
              {copied ? <Check size={15} className="text-emerald-300" /> : <Copy size={15} />}
              <span>{copied ? "COPIED" : "COPY"}</span>
            </button>
          </div>
        </motion.div>

        {/* ========================================================
            3. MENU NAVIGATION LIST (ULTRA-LUXURY WHITE CARDS)
           ======================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#1E3A8A]">
              Account Settings
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-300/60 to-transparent ml-4" />
          </div>

          {menuItems.map(({ icon: Icon, label, path }, i) => (
            <motion.button 
              key={i} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.15 + i * 0.05 }}
              onClick={() => path !== "#" && router.push(path)}
              className="luxury-card-white w-full rounded-[24px] p-4.5 flex items-center justify-between group transition-all border border-slate-200/90 shadow-sm hover:scale-[1.01]"
            >
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white shrink-0 shadow-sm">
                  <Icon size={18} strokeWidth={2.25} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-[#0F172A] group-hover:text-blue-700 transition-colors">
                  {label}
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}

          {/* SIGN OUT BUTTON */}
          <motion.button 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.4 }}
            onClick={() => { logout(); router.push("/login"); }}
            className="w-full rounded-[24px] p-4.5 flex items-center justify-between bg-rose-50/80 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
                <LogOut size={18} strokeWidth={2.25} />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                Sign Out
              </span>
            </div>
            <ChevronRight size={16} className="text-rose-400 group-hover:translate-x-1 transition-all" />
          </motion.button>
        </div>

        {/* ========================================================
            4. TASK HISTORY LIST (IF ANY)
           ======================================================== */}
        {tasks.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#1E3A8A]">
                Completed Tasks History
              </p>
              <div className="h-px flex-1 bg-gradient-to-r from-blue-300/60 to-transparent ml-4" />
            </div>

            <div className="space-y-3">
              {tasks.slice(0, 20).map((task, i) => (
                <motion.div 
                  key={task.id} 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.45 + i * 0.04 }}
                  className="luxury-card-white rounded-[24px] p-4 flex items-center gap-4 border border-slate-200/90 shadow-sm"
                >
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-blue-200 flex-shrink-0 overflow-hidden p-1.5 shadow-inner">
                    <img src={task.productImage} alt="" className="w-full h-full object-contain" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#0F172A] truncate leading-tight">{task.productName}</p>
                    <p className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <p className="text-sm font-black text-emerald-600 tabular-nums flex-shrink-0">
                    +${task.commission.toFixed(2)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
