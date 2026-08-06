"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, ArrowRight, ShieldCheck, Zap,
  TrendingUp, Activity, HelpCircle, FileText, ChevronRight,
  RefreshCw, Crown, Sparkles, Building2, Handshake, Users
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BottomNav from "@/components/layout/BottomNav";
import GlobalActivity from "@/components/dashboard/GlobalActivity";

export default function Dashboard() {
  const router = useRouter();
  const { user, token, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/profile");
      setUser(res.data.data);
    } catch (err: any) {
      console.error("Fetch profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  const actions = [
    { 
      label: "Deposit", 
      icon: ArrowUpRight, 
      path: "/wallet", 
      badgeBg: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      iconColor: "#FFFFFF",
      glowColor: "rgba(16, 185, 129, 0.25)"
    },
    { 
      label: "Withdraw", 
      icon: ArrowDownLeft, 
      path: "/wallet", 
      badgeBg: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
      iconColor: "#FFFFFF",
      glowColor: "rgba(59, 130, 246, 0.25)"
    },
    { 
      label: "Tasks", 
      icon: Zap, 
      path: "/tasks", 
      badgeBg: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
      iconColor: "#FFFFFF",
      glowColor: "rgba(245, 158, 11, 0.25)"
    },
    { 
      label: "Profile", 
      icon: Crown, 
      path: "/profile", 
      badgeBg: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      iconColor: "#FFFFFF",
      glowColor: "rgba(99, 102, 241, 0.25)"
    },
  ];

  const insights = [
    { label: "Profile", image: "/platform-profile.png", path: "/platform-profile" },
    { label: "Rules", image: "/rules.png", path: "/rules" },
    { label: "Partners", image: "/cooperation.png", path: "/partners" },
    { label: "Guide", image: "/guide.png", path: "/guide" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen luxury-bg pb-32 font-sans relative overflow-hidden">
      {/* Ambient Glow Orbs */}
      <div className="luxury-bg-orb w-[500px] h-[500px] -top-40 -left-32 bg-blue-300/30" />
      <div className="luxury-bg-orb w-[400px] h-[400px] top-1/3 -right-32 bg-sky-200/40" style={{ animationDelay: "3s" }} />

      {/* Top Gradient Divider */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

      {/* Top User Welcome Header */}
      <motion.header 
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-6 pt-8 pb-5 flex items-center justify-between relative z-10"
      >
        <div className="flex items-center gap-3">
          {/* User Avatar with Glowing Ring */}
          <div className="relative">
            <div 
              onClick={() => router.push("/profile")}
              className="h-11 w-11 rounded-2xl overflow-hidden cursor-pointer border-2 border-white shadow-md p-0.5"
              style={{ background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)" }}
            >
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-white flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-black text-blue-600 uppercase">{user.username?.substring(0, 2)}</span>
                )}
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Welcome Back</span>
              <Sparkles size={11} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-black text-[#0F172A] tracking-tight leading-none mt-0.5 truncate max-w-[160px] sm:max-w-[200px]">
              {user.username}
            </h2>
          </div>
        </div>

        {/* VIP Level Badge */}
        <motion.div 
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl cursor-pointer shadow-md border border-blue-400/30"
          style={{ 
            background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)", 
          }}
          onClick={() => router.push("/profile")}
        >
          <Crown size={15} className="text-amber-300 drop-shadow-sm" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">
            VIP {user.vipLevel}
          </span>
        </motion.div>
      </motion.header>

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="px-5 space-y-6 relative z-10"
      >
        {/* ========================================================
            1. ULTRA-PREMIUM TOTAL BALANCE CARD (FIXED & SPACIOUS)
           ======================================================== */}
        <motion.div 
          variants={itemVariants} 
          className="rounded-[30px] p-6 relative overflow-hidden text-white shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #0A1435 0%, #162F78 50%, #1D4ED8 100%)",
            border: "1px solid rgba(147, 197, 253, 0.35)",
            boxShadow: "0 16px 45px rgba(15, 23, 42, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
          }}
        >
          {/* Subtle Background Lighting Glow */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header Row */}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
                <Wallet size={18} className="text-cyan-300" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-200">
                Total Balance
              </span>
            </div>

            <button 
              onClick={fetchDashboard}
              className="p-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 active:scale-95"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Main Balance Amount Display */}
          <div className="my-2 relative z-10">
            <p className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums drop-shadow-md">
              ${Number(user.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Active Yield Vault
              </span>
            </div>
          </div>

          {/* Dedicated Bottom Profit Container */}
          <div className="mt-5 pt-3.5 border-t border-white/15 flex items-center justify-between relative z-10 bg-black/20 rounded-2xl px-4 py-3 border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
              Today's Profit
            </span>
            <span className="text-xl font-black text-amber-300 tabular-nums drop-shadow-sm">
              +${Number(user.todayEarning || user.totalCommission || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </motion.div>

        {/* 4 3D Glass Action Grid Buttons */}
        <motion.div variants={itemVariants} className="grid grid-cols-4 gap-3">
          {actions.map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(action.path)}
              className="luxury-card-white rounded-[24px] p-3 flex flex-col items-center gap-2 group cursor-pointer border border-slate-200/90 shadow-sm"
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md"
                style={{ 
                  background: action.badgeBg, 
                  boxShadow: `0 6px 16px ${action.glowColor}`
                }}
              >
                <action.icon size={22} style={{ color: action.iconColor }} strokeWidth={2.25} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1E293B] group-hover:text-blue-600 transition-colors">
                {action.label}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* ========================================================
            2. FIXED GLOBAL ACTIVITY CARD
           ======================================================== */}
        <motion.div variants={itemVariants}>
          <GlobalActivity />
        </motion.div>

        {/* Secure & Verified Banner */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          className="luxury-card-white rounded-[24px] p-4 flex items-center gap-4 cursor-pointer border border-slate-200/90 shadow-sm"
          onClick={() => router.push("/security")}
        >
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={22} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700 mb-0.5">
              Secure & Verified
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Funds protected by GMS Military Shield
            </p>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </motion.div>

        {/* Platform Insights Section */}
        <motion.div variants={itemVariants} className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#1E40AF]">
              Platform Insights
            </p>
            <ChevronRight size={15} className="text-slate-400" />
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {insights.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => router.push(item.path)}
                className="luxury-card-white relative aspect-square rounded-[22px] overflow-hidden group p-0 border border-slate-200/90 shadow-sm"
              >
                <img 
                  src={item.image} 
                  alt={item.label} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-115" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 via-transparent to-transparent flex items-end justify-center pb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-blue-300 transition-colors drop-shadow-md">
                    {item.label}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ========================================================
            3. ULTRA-PREMIUM OFFICIAL PARTNERS CARD (ORIGINAL BRAND LOGOS & GRADIENTS)
           ======================================================== */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          className="luxury-card-white rounded-[30px] p-6 relative overflow-hidden cursor-pointer group flex flex-col justify-between border border-slate-200/90 shadow-md"
          onClick={() => router.push("/partners")}
        >
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shadow-sm text-blue-600">
                <Handshake size={20} strokeWidth={2.25} />
              </div>
              <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#1E3A8A]">
                Official Partners
              </p>
            </div>

            {/* 4 Official Brand Logo Cards */}
            <div className="grid grid-cols-4 gap-3">
              {/* Amazon */}
              <div 
                className="h-14 w-full rounded-2xl border border-amber-400/40 shadow-sm flex items-center justify-center p-2 transition-all duration-300 group-hover:scale-105"
                style={{ background: "linear-gradient(135deg, #131921 0%, #1E293B 100%)" }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-[13px] font-black tracking-tight text-white italic font-serif">
                    amazon
                  </span>
                  <svg width="34" height="7" viewBox="0 0 34 7" fill="none" className="-mt-1">
                    <path d="M1 2C8 6 22 7 33 1" stroke="#FF9900" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M30 1L33.5 1.5L32 4" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              {/* Facebook */}
              <div 
                className="h-14 w-full rounded-2xl border border-blue-300/40 shadow-sm flex items-center justify-center gap-1.5 p-2 transition-all duration-300 group-hover:scale-105 text-white"
                style={{ background: "linear-gradient(135deg, #1877F2 0%, #0052CC 100%)" }}
              >
                <div className="w-5 h-5 rounded-full bg-white text-[#1877F2] flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  f
                </div>
                <span className="text-[10px] sm:text-[11px] font-black tracking-tight uppercase">
                  facebook
                </span>
              </div>

              {/* Walmart */}
              <div 
                className="h-14 w-full rounded-2xl border border-sky-300/40 shadow-sm flex items-center justify-center gap-1 p-2 transition-all duration-300 group-hover:scale-105 text-white"
                style={{ background: "linear-gradient(135deg, #0071DC 0%, #004F9A 100%)" }}
              >
                <span className="text-[11px] font-black tracking-tight italic">
                  Walmart
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#FFC220" className="shrink-0">
                  <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
                </svg>
              </div>

              {/* eBay */}
              <div 
                className="h-14 w-full rounded-2xl border border-slate-300/80 shadow-sm flex items-center justify-center p-2 transition-all duration-300 group-hover:scale-105"
                style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)" }}
              >
                <span className="text-base font-black tracking-tighter italic">
                  <span className="text-[#E53238]">e</span>
                  <span className="text-[#0064D2]">b</span>
                  <span className="text-[#F5AF02]">a</span>
                  <span className="text-[#86B817]">y</span>
                </span>
              </div>
            </div>
          </div>

          {/* Footer Separator Row */}
          <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Global Ecosystem Network
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-600 uppercase tracking-widest group-hover:gap-2.5 transition-all">
              Explore All <ArrowRight size={13} strokeWidth={2.5} />
            </div>
          </div>
        </motion.div>
      </motion.main>

      <BottomNav />
    </div>
  );
}