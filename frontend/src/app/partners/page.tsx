"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Handshake, Users, TrendingUp, Headphones, Sparkles, Globe } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

export default function Cooperation() {
  const router = useRouter();

  const benefits = [
    { title: "Agent Growth Program", icon: Users, text: "Sterling Shopify Market promotes mutual commercial synergy. Members receive direct lifetime commissions by expanding the global user network." },
    { title: "Team Volume Rewards", icon: TrendingUp, text: "Earn multi-tier commission yields based on your active network's order grabbing volume. High-volume teams unlock VIP bonus pools." },
    { title: "Dedicated 24/7 Support", icon: Headphones, text: "Access dedicated account managers, institutional training tools, and priority processing for partner accounts." }
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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Global Ecosystem</p>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Strategic Partnerships</h1>
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
          <img src="/cooperation.png" alt="Partners" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1435]/80 via-transparent to-transparent flex items-end p-6">
            <span className="px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-md text-white text-[9.5px] font-black uppercase tracking-widest">
              Win-Win Global Alliance
            </span>
          </div>
        </motion.div>

        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">Win-Win Cooperation</h2>
            <p className="text-[10.5px] font-extrabold text-blue-700 uppercase tracking-[0.25em]">Building The Future Together</p>
          </div>

          <div className="grid gap-4">
            {benefits.map((benefit, i) => (
              <motion.div 
                key={benefit.title}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="luxury-card-white rounded-[28px] p-6 border border-slate-200/90 text-center shadow-md"
              >
                <div className="h-13 w-13 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 mx-auto mb-4 shadow-sm">
                  <benefit.icon size={24} strokeWidth={2.25} />
                </div>
                <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider mb-2.5">
                  {benefit.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 font-medium max-w-[280px] mx-auto">
                  {benefit.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
