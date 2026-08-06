"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Play, MousePointer2, Wallet, Headphones, Sparkles, ShieldCheck } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

export default function Guide() {
  const router = useRouter();

  const steps = [
    { title: "How to Start", icon: Play, text: "Complete your profile, link your USDT-TRC20 wallet, and deposit funds to unlock your VIP level room." },
    { title: "How to Grab Orders", icon: MousePointer2, text: "Enter your VIP level room in the Task Engine, tap 'Start New Task', and review matched merchant products." },
    { title: "How to Earn", icon: Wallet, text: "Commissions are instantly calculated and deposited directly into your balance after completing each order." },
    { title: "Support Assistance", icon: Headphones, text: "Access 24/7 dedicated support anytime by tapping the blue floating chat widget." }
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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">User Handbook</p>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Instructions for Use</h1>
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
          <img src="/guide.png" alt="User Guide" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1435]/80 via-transparent to-transparent flex items-end p-6">
            <span className="px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-md text-white text-[9.5px] font-black uppercase tracking-widest">
              Official Platform Guide
            </span>
          </div>
        </motion.div>

        {/* Milestone Card */}
        <div className="luxury-card-soft-blue rounded-[28px] p-6 border border-blue-200/80 relative overflow-hidden shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-blue-600" />
            <h2 className="text-xs font-black text-blue-800 uppercase tracking-[0.2em]">
              Membership Milestone
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 font-medium italic">
            "To celebrate Sterling Shopify Market surpassing 10 million verified global members, our operational guide has been upgraded with instant cloud matching instructions."
          </p>
        </div>

        {/* Step List */}
        <div className="grid gap-3.5">
          {steps.map((step, i) => (
            <motion.div 
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="luxury-card-white rounded-[24px] p-5 flex items-start gap-4 border border-slate-200/90 shadow-sm"
            >
              <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                <step.icon size={20} strokeWidth={2.25} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 font-medium">
                  {step.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
