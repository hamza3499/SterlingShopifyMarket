"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Lock, Crown, CheckCircle, X, ShoppingBag, 
  ArrowLeft, Wallet, TrendingUp, MessageSquare, Sparkles,
  ChevronRight, ArrowRight, ShieldCheck, RefreshCw
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BottomNav from "@/components/layout/BottomNav";
import confetti from "canvas-confetti";

const DEFAULT_TIERS = [
  { id: '1', vip_level: 1, min_access_balance: 20, commission_rate: 3.0 },
  { id: '2', vip_level: 2, min_access_balance: 399, commission_rate: 8.0 },
  { id: '3', vip_level: 3, min_access_balance: 799, commission_rate: 12.0 },
];

export default function Tasks() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [tiers, setTiers] = useState<any[]>(DEFAULT_TIERS);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'rooms' | 'engine'>('rooms');
  const [viewTier, setViewTier] = useState<number | null>(null);

  // --- ALL LEVELS COMPLETED 24H TIMER STATE ---
  const [showAllCompletedModal, setShowAllCompletedModal] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: "24",
    minutes: "00",
    seconds: "00"
  });

  const isAllLevelsCompleted = Boolean(
    user && (user.vipLevel ?? 1) >= 3 && (user.completedTasksToday ?? 0) >= 20
  );

  // Auto-open modal when all levels completed
  useEffect(() => {
    if (isAllLevelsCompleted) {
      setShowAllCompletedModal(true);
    }
  }, [isAllLevelsCompleted]);

  // Live 24-hour countdown timer calculation
  useEffect(() => {
    if (!user?.lastTaskReset) return;
    const resetTimeStr = user.lastTaskReset;
    const updateTimer = () => {
      const resetTime = new Date(resetTimeStr).getTime();
      const targetTime = resetTime + 24 * 60 * 60 * 1000;
      const diff = targetTime - Date.now();

      if (diff <= 0) {
        setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
        setShowAllCompletedModal(false);
        // Refresh profile to trigger server-side 24h reset
        api.get("/user/profile").then((res) => {
          if (res.data?.data) useAuthStore.getState().setUser(res.data.data);
        });
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: h.toString().padStart(2, "0"),
        minutes: m.toString().padStart(2, "0"),
        seconds: s.toString().padStart(2, "0")
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user?.lastTaskReset]);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchTiers();
  }, [token]);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const [tiersRes, profileRes] = await Promise.all([
        api.get("/user/task-settings"),
        api.get("/user/profile")
      ]);
      const fetched = tiersRes.data.data;
      setTiers(fetched && fetched.length > 0 ? fetched : DEFAULT_TIERS);
      useAuthStore.getState().setUser(profileRes.data.data);
    } catch (err) { 
      console.error("Fetch error:", err);
      setTiers(DEFAULT_TIERS);
    } finally { 
      setLoading(false); 
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const [tiersRes, profileRes] = await Promise.all([
        api.get("/user/task-settings"),
        api.get("/user/profile")
      ]);
      const fetched = tiersRes.data.data;
      setTiers(fetched && fetched.length > 0 ? fetched : DEFAULT_TIERS);
      useAuthStore.getState().setUser(profileRes.data.data);
      toast.success("Tasks data refreshed ✓");
    } catch {
      toast.error("Failed to refresh tasks data");
    } finally {
      setRefreshing(false);
    }
  };

  const startMatching = async () => {
    if (isAllLevelsCompleted) {
      toast.error("All levels completed for today! Please come back tomorrow.");
      setShowAllCompletedModal(true);
      return;
    }
    const isCompletedTierView = viewTier !== null && viewTier < (user?.vipLevel || 1);
    if (isCompletedTierView || !user || (user.completedTasksToday ?? 0) >= 20) {
      toast.error(isCompletedTierView ? "Daily task limit reached for this level" : "Daily task limit reached. Contact support to refresh task"); 
      return;
    }
    setMatching(true);
    try {
      const { data } = await api.post("/user/task/generate");
      if (data.success) setCurrentTask(data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "No tasks available");
    } finally { setMatching(false); }
  };

  const submitTask = async () => {
    if (!currentTask) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/user/task/complete", { taskId: currentTask.id });
      if (data.success) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#38BDF8', '#FFFFFF', '#F59E0B']
        });
        toast.success(`+$${data.data.completedTask.commission.toFixed(2)} earned!`);
        setCurrentTask(null);
        // Update user state directly from response — instant UI update with correct counter + earnings
        if (data.data.user) {
          useAuthStore.getState().setUser(data.data.user);
          // Check if this was the last task of VIP 3
          if (data.data.user.vipLevel >= 3 && data.data.user.completedTasksToday >= 20) {
            setShowAllCompletedModal(true);
          }
        } else {
          // Fallback: re-fetch profile
          const profileRes = await api.get("/user/profile");
          useAuthStore.getState().setUser(profileRes.data.data);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSubmitting(false); }
  };

  const handleRequestUnlock = async (level: number) => {
    if (isAllLevelsCompleted) {
      toast.error("All levels completed for today! Please come back tomorrow.");
      setShowAllCompletedModal(true);
      return;
    }
    try {
      const { data } = await api.post("/user/request-level-unlock", { level });
      if (data.success) {
        toast.success("Request submitted! Please contact customer support to unlock this level.", { duration: 5000 });
        fetchTiers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  const displayTiers = tiers && tiers.length > 0 ? tiers : DEFAULT_TIERS;

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
      <div className="luxury-bg-orb w-[500px] h-[500px] -top-40 -right-32 bg-blue-300/30" />
      <div className="luxury-bg-orb w-[400px] h-[400px] top-1/3 -left-32 bg-sky-200/40" style={{ animationDelay: "3s" }} />

      {/* Top Gradient Divider */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

      {/* Header Section */}
      <motion.header 
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-6 pt-8 pb-5 relative z-10 max-w-xl mx-auto flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={13} className="text-blue-600" />
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
              Daily Operations
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0F172A]">
            Task <span className="text-blue-gradient">Engine</span>
          </h1>
        </div>

        {/* Live Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="h-11 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-blue-400/30 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={16} strokeWidth={2.5} className={refreshing ? "animate-spin text-cyan-300" : "text-cyan-300"} />
          <span className="hidden sm:inline">Refresh</span>
        </motion.button>
      </motion.header>

      <motion.main className="px-6 space-y-6 relative z-10 max-w-xl mx-auto" variants={containerVariants} initial="hidden" animate="show">
        {/* Sticky Top 24-Hour Reset Banner (High Contrast Dark Metallic Gold/Navy Card) */}
        {isAllLevelsCompleted && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0F1E4A] via-[#162F78] to-[#0F1E4A] border-2 border-amber-400/70 shadow-[0_10px_30px_rgba(245,158,11,0.3)] flex items-center justify-between gap-3 text-white"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-200 flex items-center justify-center text-slate-950 shrink-0 shadow-md">
                <Crown size={22} className="animate-bounce text-slate-950" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-300 uppercase tracking-wider">All Levels Completed Today!</p>
                <p className="text-[11px] font-extrabold text-white flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-blue-200">24-Hour Reset:</span>
                  <span className="font-mono text-cyan-300 text-xs font-black bg-slate-950/70 px-2 py-0.5 rounded-lg border border-cyan-400/40">
                    {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
                  </span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowAllCompletedModal(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-[10.5px] font-black uppercase tracking-wider shadow-lg shrink-0 cursor-pointer border border-amber-200 transition-all hover:scale-105 active:scale-95"
            >
              View Timer
            </button>
          </motion.div>
        )}
        {/* ========================================================
            1. PREMIUM ROYAL BLUE EARNINGS VAULT CARD (PERFECT SPACING & PADDING!)
           ======================================================== */}
        <motion.div
          variants={itemVariants}
          className="rounded-[32px] p-7 text-white relative overflow-hidden shadow-2xl"
          style={{ 
            background: "linear-gradient(145deg, #0A1435 0%, #112560 45%, #1D4ED8 100%)",
            border: "1px solid rgba(147, 197, 253, 0.35)",
            boxShadow: "0 22px 55px rgba(15, 23, 42, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35)"
          }}
        >
          {/* Internal Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-52 h-52 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col relative z-10 pt-1">
            {/* Top Pill Header Row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-md shadow-sm">
                <Wallet size={14} className="text-cyan-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">
                  Total Balance
                </span>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Vault</span>
              </div>
            </div>

            {/* Balance Amount Row */}
            <div className="mb-6 px-1">
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums leading-none drop-shadow-md">
                ${Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>

            {/* Earnings Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3.5 pt-4.5 border-t border-white/15">
              <div className="p-4 sm:p-4.5 rounded-2xl bg-black/25 border border-white/12 backdrop-blur-md shadow-inner">
                <p className="text-[9.5px] font-black uppercase tracking-widest text-blue-200/80 mb-1.5">
                  Today's Earning
                </p>
                <p className="text-xl font-black text-emerald-400 tabular-nums">
                  +${Number(user.todayEarning || 0).toFixed(2)}
                </p>
              </div>

              <div className="p-4 sm:p-4.5 rounded-2xl bg-black/25 border border-white/12 backdrop-blur-md shadow-inner">
                <p className="text-[9.5px] font-black uppercase tracking-widest text-blue-200/80 mb-1.5">
                  Yesterday Earning
                </p>
                <p className="text-xl font-black text-cyan-300 tabular-nums">
                  +${Number(user.yesterdayEarning || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================
            2. ENGINE VS ROOMS VIEW SWITCH
           ======================================================== */}
        {view === 'engine' ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            className="space-y-6"
          >
            <button 
              onClick={() => setView('rooms')} 
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors mb-2 bg-blue-50/90 px-4 py-2.5 rounded-2xl border border-blue-200 shadow-sm"
            >
              <ArrowLeft size={15} strokeWidth={2.5} /> Back to Rooms
            </button>
            
            {/* ========================================================
                ULTRA-LUXURY TODAY'S PROGRESS CARD (ZERO CUT-OFF!)
               ======================================================== */}
            <div className="luxury-card-soft-blue rounded-[32px] p-7 shadow-xl border border-blue-200/80 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-400/15 rounded-full blur-2xl pointer-events-none" />

              {(() => {
                const isCompletedTierView = viewTier !== null && viewTier < (user.vipLevel || 1);
                const displayTasks = isCompletedTierView ? 20 : (user.completedTasksToday ?? 0);
                const displayVip = viewTier || user.vipLevel || 1;
                const pct = Math.round((displayTasks / 20) * 100);
                
                return (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10.5px] font-black uppercase tracking-[0.25em] text-blue-700 block mb-1">
                          Today's Progress (VIP {displayVip})
                        </span>
                        <p className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight tabular-nums flex items-baseline gap-1.5">
                          <span className="text-blue-600">{displayTasks}</span>
                          <span className="text-slate-400 text-xl font-extrabold"> / 20</span>
                        </p>
                      </div>

                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-lg border-2 border-white/40 shrink-0">
                        <Crown size={26} strokeWidth={2.25} />
                      </div>
                    </div>

                    {/* Progress Bar Container with Generous Padding */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span>Completion Progress</span>
                        <span className="text-blue-700 font-extrabold">{pct}%</span>
                      </div>

                      <div className="h-4 rounded-full bg-slate-200/80 overflow-hidden p-0.5 border border-slate-300/80 shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(pct, 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full shadow-sm"
                          style={{ background: "linear-gradient(90deg, #1E40AF 0%, #2563EB 60%, #38BDF8 100%)" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Active Task Order Card Modal */}
            <AnimatePresence>
              {currentTask && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96, y: 8 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full max-w-xl mx-auto rounded-[28px] p-5 sm:p-7 relative bg-gradient-to-b from-[#0F1E4A] via-[#0A1435] to-[#060D26] border border-blue-400/35 shadow-[0_20px_50px_rgba(15,23,42,0.65)] overflow-hidden"
                >
                  {/* Card Header Row */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[9.5px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <span>Active Order</span>
                      </div>
                      {currentTask.comboId && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase tracking-wider">
                          Combo Order
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => setCurrentTask(null)} 
                      className="h-8 w-8 rounded-full bg-blue-950/60 border border-blue-400/30 text-blue-300 hover:text-white hover:bg-blue-900 transition-all flex items-center justify-center cursor-pointer"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Main Product Showcase Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#070E24]/90 border border-blue-500/20 mb-5">
                    {/* For combo orders: show each item as a separate row */}
                    {currentTask.comboId ? (() => {
                      // Parse product names — may be stored as JSONB array or as ' + ' joined string
                      const productNames: string[] = currentTask.products && currentTask.products.length > 0
                        ? currentTask.products.map((p: any) => p.name || p.product_name || '')
                        : (currentTask.productName || '').split(' + ').map((s: string) => s.trim()).filter(Boolean);
                      return (
                        <div className="space-y-3 mb-4">
                          {productNames.map((name: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 bg-[#030716]/80 rounded-xl p-3 border border-blue-500/20">
                              <div className="h-12 w-12 rounded-lg overflow-hidden p-1.5 bg-white border border-blue-300/40 shrink-0 flex items-center justify-center relative">
                                <img 
                                  src={currentTask.products?.[idx]?.image_url || currentTask.productImage} 
                                  alt="" 
                                  className="w-full h-full object-contain" 
                                />
                                <div className="absolute top-0 left-0 bg-amber-500 text-white text-[8px] font-black px-1 rounded-br-md">{idx + 1}</div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-white leading-snug line-clamp-2">{name}</p>
                                <p className="text-[9px] text-blue-300/50 font-bold mt-0.5">Verified Shopify Item</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })() : (
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-xl overflow-hidden p-2 bg-white border border-blue-300/50 shadow-md flex items-center justify-center shrink-0">
                          <img src={currentTask.productImage} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-black text-white leading-snug truncate">{currentTask.productName}</h3>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300/60 mt-0.5">Verified Shopify Merchant Item</p>
                        </div>
                      </div>
                    )}

                    {/* Order Metrics Row */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-900/40">
                      <div className="bg-[#030716] p-3 rounded-xl border border-blue-500/20">
                        <p className="text-[8.5px] font-black uppercase tracking-widest text-blue-300/70 mb-0.5">Order Price</p>
                        <p className="text-base font-black text-white tabular-nums">${currentTask.price?.toFixed(2)}</p>
                      </div>
                      <div className="bg-[#030716] p-3 rounded-xl border border-emerald-500/30">
                        <p className="text-[8.5px] font-black uppercase tracking-widest text-emerald-400/80 mb-0.5">Commission</p>
                        <p className="text-base font-black text-emerald-400 tabular-nums">+${currentTask.commission?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Complete & Earn Button */}
                  <button 
                    onClick={submitTask} 
                    disabled={submitting} 
                    className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 text-xs sm:text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_8px_25px_rgba(245,158,11,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #D97706 100%)",
                    }}
                  >
                    {submitting ? (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={19} strokeWidth={2.75} />
                        <span>Complete & Earn</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start New Task Button */}
            {!currentTask && (
              <button 
                onClick={startMatching} 
                disabled={matching}
                className="btn-blue w-full py-5 rounded-[26px] flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.15em] text-white shadow-[0_12px_35px_rgba(37,99,235,0.45)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {matching ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Matching Task...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} strokeWidth={2.5} className="fill-white" />
                    <span>Start New Task</span>
                  </>
                )}
              </button>
            )}
          </motion.div>
        ) : (
          /* ========================================================
              3. ULTRA-LUXURY BOSSY FLOATING VIP TIER CARDS
                 (EXACT YIELD RATES: VIP1=3%, VIP2=8%, VIP3=12%)
             ======================================================== */
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }} 
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#1E3A8A]">
                Available Tiers
              </p>
              <div className="h-px flex-1 bg-gradient-to-r from-blue-300/60 to-transparent ml-4" />
            </div>
          
            <div className="space-y-5">
              {displayTiers.map((tier, i) => {
                const requiredBalance = tier.min_access_balance || (tier.vip_level === 1 ? 20 : tier.vip_level === 2 ? 399 : 799);
                
                const isApproved = (user.approvedVipLevel || 0) >= tier.vip_level;
                const isPending = user.vipLevelRequest === tier.vip_level && user.vipLevelRequestStatus === 'pending';
                // A level is "completed" only if user has SURPASSED it (moved to a higher level)
                // For current level: only completed if 20 tasks done AND still on this level
                const isCompleted = tier.vip_level < (user.vipLevel || 1) 
                  || (tier.vip_level === user.vipLevel && (user.completedTasksToday ?? 0) >= 20);
                const isCurrentRoom = user.vipLevel === tier.vip_level && !isCompleted && isApproved;
                const isLocked = tier.vip_level > (user.vipLevel || 1) && !isApproved;

                // Exact Yield Rate Schedule: VIP 1 = 3%, VIP 2 = 8%, VIP 3 = 12%
                const commissionRates: Record<number, number> = { 1: 3.0, 2: 8.0, 3: 12.0 };
                const commission = (commissionRates[tier.vip_level] ?? tier.commission_rate ?? 3.0).toFixed(1);

                return (
                  <motion.div
                    key={tier.id || tier.vip_level}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-[32px] p-6 sm:p-7 relative overflow-hidden transition-all duration-300"
                    style={{ 
                      background: "linear-gradient(135deg, #FFFFFF 0%, #F5F9FF 60%, #EBF3FF 100%)",
                      border: isCurrentRoom 
                        ? "2px solid #2563EB" 
                        : isCompleted 
                        ? "2px solid #059669" 
                        : "1px solid rgba(191, 219, 254, 0.8)",
                      boxShadow: "0 14px 38px rgba(30, 64, 175, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1)",
                      opacity: isApproved || isCompleted || tier.vip_level === 1 ? 1 : 0.95,
                    }}
                  >
                    {/* Ambient Glow Orb */}
                    <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />

                    {/* Top Row: Icon Badge, Title & Pill Badge */}
                    <div className="flex items-center justify-between mb-5 relative z-10">
                      <div className="flex items-center gap-4">
                        {/* 3D Floating Icon Ring */}
                        <div 
                          className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                          style={{
                            background: isLocked 
                              ? "linear-gradient(135deg, #64748B 0%, #475569 100%)" 
                              : "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)",
                            boxShadow: isLocked 
                              ? "0 6px 16px rgba(100,116,139,0.25)" 
                              : "0 8px 24px rgba(37,99,235,0.35)",
                          }}
                        >
                          {isLocked ? <Lock size={22} strokeWidth={2.25} /> : <Crown size={24} strokeWidth={2.25} />}
                        </div>

                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight whitespace-nowrap leading-tight">
                            VIP Level {tier.vip_level}
                          </h3>
                          <p className="text-[10.5px] font-black uppercase tracking-wider text-blue-600 mt-1 flex items-center gap-1">
                            <ShieldCheck size={12} className="text-blue-600" />
                            <span>Shopify Official Tier {tier.vip_level}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right Status Badge */}
                      <span 
                        className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm flex-shrink-0 border"
                        style={{
                          background: isCompleted 
                            ? "#ECFDF5" 
                            : isCurrentRoom || tier.vip_level === 1
                            ? "#EFF6FF" 
                            : "#F8FAFC",
                          borderColor: isCompleted 
                            ? "#A7F3D0" 
                            : isCurrentRoom || tier.vip_level === 1
                            ? "#BFDBFE" 
                            : "#E2E8F0",
                          color: isCompleted 
                            ? "#047857" 
                            : isCurrentRoom || tier.vip_level === 1
                            ? "#1D4ED8" 
                            : "#475569"
                        }}
                      >
                        {isCompleted ? '✓ Done' : isCurrentRoom ? '★ Active' : `VIP L${tier.vip_level}`}
                      </span>
                    </div>

                    {/* Middle Floating Metric Vault */}
                    <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-white/90 border border-blue-100/90 shadow-sm my-4 relative z-10 text-center">
                      <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/60">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                          Yield Rate
                        </p>
                        <p className="text-lg font-black text-blue-700 tabular-nums">
                          {commission}%
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                          Requirement
                        </p>
                        <p className="text-lg font-black text-[#0F172A] tabular-nums">
                          ${requiredBalance}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/60">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                          Progress
                        </p>
                        <p className="text-lg font-black text-indigo-700 tabular-nums">
                          {user.vipLevel === tier.vip_level ? (user.completedTasksToday ?? 0) : user.vipLevel > tier.vip_level ? 20 : 0}/20
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="mt-5 relative z-10">
                      {isCompleted ? (
                        <button 
                          onClick={() => { setViewTier(tier.vip_level); setView('engine'); }} 
                          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.15em] bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
                        >
                          <span>View Completed Room</span>
                        </button>
                      ) : isApproved ? (
                        <button 
                          onClick={() => { setViewTier(tier.vip_level); setView('engine'); }} 
                          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.15em] text-white shadow-xl transition-all hover:scale-[1.01] cursor-pointer"
                          style={{
                            background: "linear-gradient(135deg, #0A1435 0%, #162F78 50%, #1D4ED8 100%)",
                            boxShadow: "0 10px 28px rgba(29, 78, 216, 0.35)",
                          }}
                        >
                          <span>Enter Room</span>
                          <ArrowRight size={16} strokeWidth={2.5} />
                        </button>
                      ) : isPending ? (
                        <button 
                          disabled
                          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.15em] bg-amber-50 text-amber-700 border border-amber-300 cursor-not-allowed opacity-90 shadow-sm"
                        >
                          <span>Pending Approval</span>
                        </button>
                      ) : (user.completedTasksToday ?? 0) < 20 && tier.vip_level > (user.vipLevel || 1) ? (
                        <button 
                          disabled
                          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.15em] bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        >
                          <Lock size={15} />
                          <span>Complete VIP {tier.vip_level - 1} First</span>
                        </button>
                      ) : user.balance < requiredBalance ? (
                        <button 
                          disabled
                          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.15em] bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
                        >
                          <span>Min Balance ${requiredBalance} Required</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleRequestUnlock(tier.vip_level)}
                          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.15em] bg-white text-blue-700 border-2 border-blue-600 hover:bg-blue-50 transition-all shadow-md cursor-pointer"
                        >
                          <span>Request for Approval</span>
                          <ArrowRight size={16} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.main>

      <BottomNav />

      {/* ALL LEVELS COMPLETED 24-HOUR COUNTDOWN MODAL */}
      <AnimatePresence>
        {showAllCompletedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-[36px] p-6 sm:p-8 relative bg-gradient-to-b from-[#111F4D] via-[#0A1435] to-[#04091A] border-2 border-amber-400/50 shadow-[0_0_80px_rgba(245,158,11,0.3)] overflow-hidden text-center"
            >
              {/* Ambient Glowing Background Orbs */}
              <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setShowAllCompletedModal(false)}
                className="absolute top-5 right-5 h-9 w-9 rounded-full bg-blue-950/80 border border-amber-400/30 text-amber-300 hover:text-white hover:bg-amber-500/20 transition-all flex items-center justify-center cursor-pointer z-20"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              {/* Top Trophy / Crown Badge Container */}
              <div className="relative z-10 mx-auto w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 p-0.5 shadow-[0_10px_35px_rgba(245,158,11,0.45)]">
                <div className="w-full h-full rounded-[22px] bg-[#0A1435] flex items-center justify-center text-amber-400 relative overflow-hidden">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  >
                    <Crown size={48} strokeWidth={2.2} className="drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                  </motion.div>
                </div>
              </div>

              {/* Badge Banner */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-[0.25em] mb-3 shadow-inner">
                <Sparkles size={13} className="text-amber-400 animate-spin" />
                <span>DAILY APEX ACHIEVED</span>
              </div>

              {/* Main Congratulations Header */}
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent tracking-tight leading-tight mb-2">
                CONGRATULATIONS!
              </h2>

              <p className="text-xs sm:text-sm font-semibold text-blue-200/90 leading-relaxed max-w-md mx-auto mb-6">
                You have successfully completed <span className="text-amber-300 font-extrabold">All VIP Levels</span> for today! Please come back tomorrow.
              </p>

              {/* 24-Hour Timer Showcase Vault */}
              <div className="p-5 rounded-3xl bg-[#030716]/90 border border-amber-400/30 shadow-inner mb-6 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80 mb-3 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>24-HOUR RESET COUNTDOWN</span>
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {/* Hours */}
                  <div className="p-3 rounded-2xl bg-[#08112C] border border-blue-400/30 shadow-md">
                    <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-wider block">
                      {timeLeft.hours}
                    </span>
                    <span className="text-[8.5px] font-black uppercase tracking-widest text-blue-300/60 block mt-1">
                      Hours
                    </span>
                  </div>

                  {/* Minutes */}
                  <div className="p-3 rounded-2xl bg-[#08112C] border border-blue-400/30 shadow-md">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums tracking-wider block">
                      {timeLeft.minutes}
                    </span>
                    <span className="text-[8.5px] font-black uppercase tracking-widest text-amber-400/60 block mt-1">
                      Minutes
                    </span>
                  </div>

                  {/* Seconds */}
                  <div className="p-3 rounded-2xl bg-[#08112C] border border-blue-400/30 shadow-md">
                    <span className="text-2xl sm:text-3xl font-black text-blue-400 tabular-nums tracking-wider block">
                      {timeLeft.seconds}
                    </span>
                    <span className="text-[8.5px] font-black uppercase tracking-widest text-blue-300/60 block mt-1">
                      Seconds
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <p className="text-[10.5px] font-extrabold text-blue-300/70 mb-6 uppercase tracking-wider">
                The daily task cycle will restart automatically after 24 hours.
              </p>

              {/* Action Button */}
              <button
                onClick={() => setShowAllCompletedModal(false)}
                className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.18em] text-slate-950 text-xs sm:text-sm shadow-[0_10px_30px_rgba(245,158,11,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #D97706 100%)",
                }}
              >
                <span>UNDERSTOOD & RETURN TOMORROW</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}