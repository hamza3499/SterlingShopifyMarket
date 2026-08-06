"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Shield, Target, Building2, Sparkles } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

export default function PlatformProfile() {
  const router = useRouter();

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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Corporate Overview</p>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Company Profile</h1>
        </div>

        <div className="w-11" />
      </header>

      <main className="px-5 space-y-6 relative z-10 mt-2">
        {/* HQ Banner Image */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="aspect-[16/9] rounded-[32px] overflow-hidden border-2 border-white/60 shadow-2xl relative group"
        >
          <img src="/platform-profile.png" alt="Sterling Headquarters" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1435]/80 via-transparent to-transparent flex items-end p-6">
            <div>
              <span className="px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-md text-white text-[9.5px] font-black uppercase tracking-widest">
                London Headquarters • Est. 2018
              </span>
              <h2 className="text-xl font-black text-white tracking-tight mt-1.5 drop-shadow-md">
                Sterling Shopify Market Corporate HQ
              </h2>
            </div>
          </div>
        </motion.div>

        {/* Content Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="space-y-4"
        >
          <div className="luxury-card-white rounded-[28px] p-6 border border-slate-200/90 shadow-md">
            <h2 className="text-[#0F172A] text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Globe size={18} strokeWidth={2.25} />
              </div>
              <span>Global Order Hub</span>
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 font-medium">
              Sterling Shopify Market is an intelligent cloud global order matching ecosystem. Established in 2018 and headquartered in London, UK, the platform operates active commercial branches in over 20 countries worldwide.
            </p>
          </div>

          <div className="luxury-card-white rounded-[28px] p-6 border border-slate-200/90 shadow-md">
            <h2 className="text-[#0F172A] text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Shield size={18} strokeWidth={2.25} />
              </div>
              <span>AI Task Optimization</span>
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 font-medium">
              Powered by advanced proprietary AI algorithms, Sterling Shopify Market connects premier global e-commerce merchants with verified users to accelerate product exposure while rewarding platform members with instant commission payouts.
            </p>
          </div>

          <div className="luxury-card-white rounded-[28px] p-6 border border-slate-200/90 shadow-md">
            <h2 className="text-[#0F172A] text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Target size={18} strokeWidth={2.25} />
              </div>
              <span>Our Core Mission</span>
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 font-medium">
              Our mission is to engineer the world’s most secure, transparent, and rewarding merchant order optimization network—delivering continuous value to merchants and users alike.
            </p>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
