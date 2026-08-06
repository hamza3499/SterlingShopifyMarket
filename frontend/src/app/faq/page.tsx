"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, HelpCircle, Sparkles } from "lucide-react";

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How to recharge account balance?",
      answer: "Navigate to the Vault & Wallet section, select 'Deposit', scan the official TRC20 QR code or copy the address. Input the deposited amount, attach your payment screenshot proof, and click 'Submit Deposit'."
    },
    {
      question: "How to request a withdrawal?",
      answer: "Go to Vault & Wallet, select 'Withdraw', enter your desired withdrawal amount and paste your USDT-TRC20 address. Submissions are verified and processed automatically."
    },
    {
      question: "What is order grabbing & optimization?",
      answer: "Order grabbing is a strategic merchant task optimization system. By submitting orders on behalf of luxury merchants, you boost their store sales rating and earn an instant percentage commission."
    },
    {
      question: "How to upgrade your VIP tier level?",
      answer: "VIP levels auto-upgrade based on your total account balance and overall completed task volume. Higher VIP tiers unlock larger commission yields and priority task allocation."
    }
  ];

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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Knowledge Base</p>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Frequently Asked Questions</h1>
        </div>

        <div className="w-11" />
      </header>

      <main className="px-5 space-y-4 relative z-10 mt-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.08 }}
              className={`rounded-[26px] overflow-hidden transition-all border ${
                isOpen 
                  ? "luxury-card-soft-blue border-blue-300/90 shadow-md" 
                  : "luxury-card-white border-slate-200/90 shadow-sm hover:border-blue-200"
              }`}
            >
              <button 
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-5 flex items-center justify-between text-left gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isOpen ? "bg-blue-600 text-white border-blue-500" : "bg-blue-50 text-blue-600 border-blue-200"
                  }`}>
                    <HelpCircle size={17} strokeWidth={2.25} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A] leading-relaxed">
                    {faq.question}
                  </h3>
                </div>

                <motion.div 
                  animate={{ rotate: isOpen ? 180 : 0 }} 
                  transition={{ duration: 0.25 }}
                  className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center border ${
                    isOpen ? "bg-white text-blue-600 border-blue-200" : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}
                >
                  <ChevronDown size={16} strokeWidth={2.5} />
                </motion.div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="px-6 pb-6 pt-1">
                      <div className="w-full h-px bg-gradient-to-r from-blue-300/50 to-transparent mb-4" />
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </main>
    </div>
  );
}
