"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Shield, ShieldCheck, CheckCircle2, Lock } from "lucide-react";

export default function SecurityProfile() {
  const router = useRouter();

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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verified Protection</p>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Trust & Security</h1>
        </div>

        <div className="w-11" />
      </header>

      <main className="px-5 space-y-6 relative z-10 mt-4">
        {/* Trusted Partners Banner Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-card-white rounded-[32px] p-7 text-center border border-slate-200/90 shadow-lg"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-700 mb-5">
            Certified & Trusted By
          </p>

          <div className="flex items-center justify-center gap-7 py-3">
            <span className="text-[#0F172A] font-black text-2xl italic tracking-tighter">
              VISA
            </span>

            <div className="flex -space-x-3.5 items-center">
              <div className="w-9 h-9 rounded-full bg-[#EB001B] shadow-md" />
              <div className="w-9 h-9 rounded-full bg-[#F79E1B] shadow-md" />
            </div>

            <span className="text-blue-700 font-black text-2xl italic tracking-tighter">
              PayPal
            </span>
          </div>

          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">
            * 256-Bit SSL Encrypted Financial Protocol
          </p>
        </motion.div>

        {/* Compliance Certificate Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }}
          className="luxury-card-soft-blue rounded-[32px] p-8 text-center flex flex-col items-center shadow-xl border border-blue-200/80"
        >
          <div className="h-20 w-20 rounded-[24px] bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center mb-5 shadow-xl border-2 border-white/40">
            <FileText size={36} strokeWidth={2} />
          </div>
          
          <h2 className="text-base font-black uppercase tracking-[0.2em] text-[#0F172A] mb-2">
            Compliance Certificates
          </h2>
          
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[260px] mx-auto mb-7">
            View official business registration, security compliance, and licensing certificates.
          </p>

          <button 
            onClick={() => router.push('/certificate')} 
            className="btn-blue w-full py-4.5 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-black uppercase tracking-[0.15em] text-white shadow-[0_12px_32px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.01]"
          >
            <ShieldCheck size={18} strokeWidth={2.25} />
            <span>View Official Certificates</span>
          </button>
        </motion.div>
      </main>
    </div>
  );
}
