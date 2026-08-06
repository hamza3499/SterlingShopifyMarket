"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Save, Smartphone, Lock, ShieldCheck, Check } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function WalletAddress() {
  const router = useRouter();
  const { user, token, setUser } = useAuthStore();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const isLocked = !!user?.withdrawalAddress;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (user?.withdrawalAddress) {
      setAddress(user.withdrawalAddress);
    }
  }, [token, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    
    if (!address || address.length < 10) {
      toast.error("Please enter a valid wallet address");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put("/user/withdrawal-address", { address });
      if (data.success) {
        toast.success("Wallet address saved and locked");
        const updatedUser = { ...user, withdrawalAddress: address };
        setUser(updatedUser as any);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen luxury-bg pb-28 font-sans relative overflow-hidden">
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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Security Vault</p>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Wallet Settings</h1>
        </div>

        <div className="w-11" />
      </header>

      <main className="px-5 space-y-6 relative z-10 mt-4">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-card-soft-blue rounded-[32px] p-7 sm:p-8 relative overflow-hidden shadow-xl border border-blue-200/80"
        >
          {/* Header Row */}
          <div className="flex items-center gap-4 mb-7">
            <div className="h-13 w-13 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-md shrink-0">
              <CreditCard size={24} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0F172A] uppercase tracking-wider">
                Secure Wallet
              </h2>
              <p className="text-[10.5px] font-extrabold text-blue-700 uppercase tracking-widest mt-0.5">
                {isLocked ? "Permanently Locked" : "Default USDT-TRC20 Address"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-[10.5px] font-black uppercase tracking-widest text-slate-500 block px-1">
                USDT-TRC20 Wallet Address
              </label>

              {/* 3D Input Field */}
              <div className="bg-white border-2 border-blue-200/80 rounded-2xl p-2.5 flex items-center gap-3 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 shadow-sm transition-all relative">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${isLocked ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                  <Smartphone size={18} />
                </div>

                <input
                  type="text"
                  placeholder="Paste your TRC20 address here"
                  value={address}
                  onChange={(e) => !isLocked && setAddress(e.target.value)}
                  readOnly={isLocked}
                  className={`w-full bg-transparent border-none outline-none text-xs font-mono font-bold text-[#0F172A] pr-3 ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                />

                {isLocked && (
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                    <Lock size={11} />
                    <span>Locked</span>
                  </div>
                )}
              </div>

              <p className="text-[9.5px] font-bold text-slate-400 px-1 leading-relaxed">
                {isLocked 
                  ? "🔒 Withdrawal address is locked for security. Contact support to request updates."
                  : "⚠️ Double-check your address. TRC20 transactions are irreversible and this address locks upon saving."
                }
              </p>
            </div>

            {!isLocked && (
              <button 
                type="submit" 
                disabled={loading}
                className="btn-blue w-full py-4.5 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.15em] text-white shadow-[0_12px_32px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.01]"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Save size={18} strokeWidth={2.5} />
                    <span>Save & Lock Address</span>
                  </>
                )}
              </button>
            )}
          </form>
        </motion.div>

        {isLocked && (
          <div className="p-5 rounded-[24px] bg-blue-50/90 border border-blue-200/90 flex items-start gap-3.5 shadow-sm">
            <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <p className="text-[10.5px] leading-relaxed text-blue-900 font-bold uppercase tracking-wider">
              This address is permanently locked to your account vault. All automated withdrawals will be deposited directly here for maximum security.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
