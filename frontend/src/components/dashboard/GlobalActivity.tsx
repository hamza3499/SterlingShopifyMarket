"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_DATA = [
  { country: "SG", user: "U....98", amount: 35.00 },
  { country: "UK", user: "U....12", amount: 85.00 },
  { country: "AE", user: "U....45", amount: 115.00 },
  { country: "US", user: "U....09", amount: 275.00 },
  { country: "CA", user: "U....77", amount: 987.00 },
  { country: "CH", user: "U....33", amount: 1450.50 },
  { country: "FR", user: "U....61", amount: 2100.00 },
  { country: "DE", user: "U....22", amount: 3340.20 },
  { country: "JP", user: "U....88", amount: 4210.00 },
  { country: "AU", user: "U....54", amount: 4958.00 },
];

export default function GlobalActivity() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => {
        let next = Math.floor(Math.random() * MOCK_DATA.length);
        while (next === prev) {
          next = Math.floor(Math.random() * MOCK_DATA.length);
        }
        return next;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const data = MOCK_DATA[index];

  return (
    <div className="bg-white rounded-[26px] p-5 border border-slate-200/90 shadow-[0_8px_30px_rgba(30,64,175,0.08)] relative overflow-hidden transition-all duration-300">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#1E3A8A] leading-none">
            Global Activity
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9.5px] font-black uppercase tracking-widest text-emerald-700 leading-none">
            Live Ticker
          </span>
        </div>
      </div>

      {/* Ticker Display Container */}
      <div className="relative h-15 min-h-[56px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-between rounded-2xl px-4 bg-slate-50 border border-slate-200/70"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-[11px] text-white shadow-md"
                style={{
                  background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
                }}
              >
                {data.country}
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-sm font-extrabold text-[#0F172A] tracking-tight leading-tight">
                  {data.user}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Verified Member
                </span>
              </div>
            </div>

            <div className="text-right flex flex-col justify-center">
              <p className="text-base font-black text-emerald-600 tabular-nums tracking-wide leading-tight">
                +${data.amount.toFixed(2)}
              </p>
              <p className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
                Just Matched
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Decorative Bottom Shimmer Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
    </div>
  );
}
