"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Star, Sparkles, ShoppingBag, ShieldCheck } from "lucide-react";

export default function SplashPage() {
  const router = useRouter();

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center font-sans px-5 py-10"
      style={{
        background: "radial-gradient(circle at 50% 0%, #17378B 0%, #0A1435 55%, #040817 100%)"
      }}
    >
      {/* Animated Background Mesh Glow Orbs */}
      <div className="absolute -top-36 -right-36 w-[550px] h-[550px] bg-blue-600/25 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -left-36 w-[450px] h-[450px] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" style={{ animationDelay: "3s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-indigo-600/20 rounded-full blur-[90px] pointer-events-none" style={{ animationDelay: "6s" }} />

      {/* Top Cyan Laser Shimmer Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38BDF8]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center text-center w-full max-w-sm mx-auto"
      >
        {/* 3D Floating Official Shopify Brand Badge */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 18 }}
          className="relative h-[92px] w-[92px] mx-auto mb-7 p-1.5 rounded-3xl"
          style={{
            background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #38BDF8 100%)",
            boxShadow: "0 16px 45px rgba(56, 189, 248, 0.45), inset 0 1px 0 rgba(255,255,255,0.4)"
          }}
        >
          <div className="w-full h-full rounded-[20px] bg-[#070E24] flex items-center justify-center text-cyan-300 relative overflow-hidden border border-cyan-400/40">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            >
              <ShoppingBag size={46} strokeWidth={2.2} className="drop-shadow-[0_0_14px_rgba(56,189,248,0.85)]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Brand Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl sm:text-5xl font-black tracking-tight mb-2 leading-none"
        >
          <span className="text-white">Sterling</span>{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-amber-300 bg-clip-text text-transparent">Market</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-cyan-300/90 mb-4 flex items-center justify-center gap-1.5"
        >
          <Sparkles size={14} className="text-amber-400 animate-spin" />
          <span>ULTRA-VIP GLOBAL FINTECH PLATFORM</span>
        </motion.p>

        {/* Divider Shimmer */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.48 }}
          className="w-40 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto my-3"
        />

        {/* Feature Badges (High Contrast Glass Pills) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58 }}
          className="flex flex-wrap items-center justify-center gap-2.5 my-6"
        >
          {[
            { icon: Shield, label: "GMS SECURED" },
            { icon: Star,   label: "VIP ACCESS"  },
            { icon: Zap,    label: "INSTANT YIELD" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#07112C] border border-cyan-400/40 text-cyan-300 shadow-[0_0_18px_rgba(56,189,248,0.2)]"
            >
              <Icon size={13} className="text-cyan-300" strokeWidth={2.5} />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68 }}
          className="flex flex-col gap-3.5 w-full mt-2"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/login")}
            className="w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.18em] text-white shadow-[0_12px_35px_rgba(37,99,235,0.5)] cursor-pointer flex items-center justify-center gap-2.5 border border-blue-300/40"
            style={{
              background: "linear-gradient(135deg, #0F2573 0%, #1E40AF 50%, #2563EB 100%)",
            }}
          >
            <span>ACCESS PLATFORM</span>
            <ArrowRight size={17} strokeWidth={2.5} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/register")}
            className="w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.18em] text-cyan-300 bg-[#060D24]/80 border-2 border-cyan-400/50 hover:border-cyan-400 hover:bg-[#0C1B4A] shadow-lg cursor-pointer transition-all duration-200"
          >
            CREATE VIP ACCOUNT
          </motion.button>
        </motion.div>

        {/* Footer Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-[10.5px] font-black uppercase tracking-widest text-blue-300/70 flex items-center justify-center gap-2"
        >
          <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-400" /> ENCRYPTED</span>
          <span>•</span>
          <span>VERIFIED</span>
          <span>•</span>
          <span>GLOBAL HUB</span>
        </motion.div>
      </motion.div>

      {/* Bottom Shimmer Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38BDF8]" />
    </div>
  );
}
