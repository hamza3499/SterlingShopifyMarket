"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ShoppingBag, Sparkles } from "lucide-react";

export default function Header() {
  const pathname = usePathname();

  const isAdmin  = pathname.startsWith("/admin");
  const isHidden = pathname === "/" || pathname === "/login" || pathname === "/register";

  if (isHidden) return null;

  return (
    <header className="sticky top-0 left-0 right-0 z-[100]">
      {/* Glossy Royal Blue & Crystal White Glassmorphism Background */}
      <div
        className="backdrop-blur-2xl px-4 py-3 sm:px-6 sm:py-3.5"
        style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(239, 246, 255, 0.96) 55%, rgba(219, 234, 254, 0.94) 100%)",
          borderBottom: "1.5px solid rgba(37, 99, 235, 0.25)",
          boxShadow: "0 8px 32px rgba(30, 64, 175, 0.12), inset 0 1px 0 rgba(255, 255, 255, 1)",
        }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3.5">
          {/* Shopify Official Brand Icon with Sapphire Glow Ring */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-11 w-11 rounded-2xl flex-shrink-0 relative p-0.5"
            style={{
              background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #38BDF8 100%)",
              boxShadow: "0 6px 20px rgba(37, 99, 235, 0.45)",
            }}
          >
            <div className="w-full h-full rounded-[14px] bg-[#0A1435] flex items-center justify-center text-cyan-300">
              <ShoppingBag size={22} strokeWidth={2.25} className="drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
            </div>
          </motion.div>

          {/* Platform Title */}
          <div className="flex-1 flex flex-col min-w-0">
            <h1 className="text-[14px] font-black tracking-tight text-[#0F172A] uppercase truncate flex items-center gap-1.5">
              Sterling <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent font-black">SHOPIFY MARKET</span>
            </h1>
            <p className="text-[9px] font-extrabold text-blue-700/80 uppercase tracking-[0.25em] flex items-center gap-1 mt-0.5">
              <Sparkles size={11} className="text-blue-600 animate-pulse" />
              <span>{isAdmin ? "COMMAND CENTER | VIP ADMIN" : "GLOBAL HUB PLATFORM"}</span>
            </p>
          </div>

          {isAdmin && (
            <div
              className="px-3 py-1 rounded-full flex-shrink-0 border border-blue-300/60"
              style={{
                background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
              }}
            >
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Admin</span>
            </div>
          )}
        </div>
      </div>

      {/* Sapphire Blue Shimmer Line */}
      <div className="h-[1.5px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
    </header>
  );
}
