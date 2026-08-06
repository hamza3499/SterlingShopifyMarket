"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Scale, CreditCard, Clock, Lock, ShieldCheck } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

export default function Rules() {
  const router = useRouter();

  const rules = [
    { title: "Recharge Rules", icon: CreditCard, text: "The platform dynamically rotates deposit vault addresses for institutional security. Always verify the latest USDT-TRC20 address before initiating each deposit." },
    { title: "Withdrawal Rules", icon: Clock, text: "Automated user withdrawals are verified and processed within 24 hours. The minimum withdrawal is $10.00. Address locks protect member funds permanently." },
    { title: "Task Rules", icon: Scale, text: "Each VIP level tier features 20 daily task allocations. Daily sessions reset automatically every 24 hours." },
    { title: "Account Security", icon: Lock, text: "Members are responsible for credential safety. Mandatory SSL encryption protocols protect all financial transactions." }
  ];

  return (
    <div className="min-h-screen luxury-bg pb-32 relative overflow-hidden font-sans">
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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Institutional Terms</p>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Platform Rules</h1>
        </div>

        <div className="w-11" />
      </header>

      <main className="px-5 space-y-6 relative z-10 mt-2">
        {/* Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="aspect-[16/9] rounded-[32px] overflow-hidden border-2 border-white/60 shadow-2xl relative"
        >
          <img src="/rules.png" alt="Platform Rules" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1435]/80 via-transparent to-transparent flex items-end p-6">
            <span className="px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-md text-white text-[9.5px] font-black uppercase tracking-widest">
              Verified Compliance Standards
            </span>
          </div>
        </motion.div>

        {/* Rule Cards */}
        <div className="space-y-4">
          {rules.map((rule, i) => (
            <motion.div 
              key={rule.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="luxury-card-white rounded-[28px] p-6 border border-slate-200/90 shadow-md"
            >
              <div className="flex items-center gap-3.5 mb-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                  <rule.icon size={20} strokeWidth={2.25} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-wider text-[#0F172A]">
                  {rule.title}
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 font-medium pl-1">
                {rule.text}
              </p>
            </motion.div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
