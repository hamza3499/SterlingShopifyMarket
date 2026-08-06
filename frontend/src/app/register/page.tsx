"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Gift, ShoppingBag, Sparkles, MessageSquare, Send, X, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    inviteCode: inviteCode || "",
  });

  // PUBLIC SUPPORT MODAL STATE
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);

  useEffect(() => {
    if (inviteCode) setFormData(prev => ({ ...prev, inviteCode }));
  }, [inviteCode]);

  const handleSendPublicSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportEmail || !supportEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!supportMessage || supportMessage.trim().length === 0) {
      toast.error("Please enter your message");
      return;
    }
    setSendingSupport(true);
    try {
      const { data } = await api.post("/chat/public-message", {
        email: supportEmail,
        message: supportMessage
      });
      if (data.success) {
        toast.success(data.message || "Message sent to Sterling Customer Support!");
        setSupportMessage("");
        setShowSupportModal(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send support message");
    } finally {
      setSendingSupport(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", formData);
      toast.success("Account Created Successfully! Please login.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[400px] mx-auto relative z-10"
    >
      {/* ===== HEADER ===== */}
      <div className="text-center mb-8">
        {/* 3D Floating Official Shopify Brand Badge */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 18 }}
          className="relative h-[84px] w-[84px] mx-auto mb-5 p-1 rounded-3xl"
          style={{
            background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #38BDF8 100%)",
            boxShadow: "0 14px 40px rgba(56, 189, 248, 0.45), inset 0 1px 0 rgba(255,255,255,0.4)"
          }}
        >
          <div className="w-full h-full rounded-[20px] bg-[#070E24] flex items-center justify-center text-cyan-300 relative overflow-hidden border border-cyan-400/30">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <ShoppingBag size={40} strokeWidth={2.2} className="drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
            </motion.div>
          </div>
        </motion.div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight mb-1.5">
          Join <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-amber-300 bg-clip-text text-transparent">Sterling</span>
        </h1>

        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto my-3" />

        <p className="text-[10.5px] font-black uppercase tracking-[0.3em] text-cyan-300/90 flex items-center justify-center gap-1.5">
          <Sparkles size={12} className="text-amber-400 animate-spin" />
          <span>CREATE VIP MEMBER ACCOUNT</span>
        </p>
      </div>

      {/* ===== MAIN LUXURY GLASS CARD ===== */}
      <div className="rounded-[36px] p-7 sm:p-8 relative bg-gradient-to-b from-[#0F1E4A]/95 via-[#0A1435]/95 to-[#060D26]/95 border-2 border-blue-400/35 shadow-[0_20px_60px_rgba(4,9,26,0.8)] backdrop-blur-2xl overflow-hidden">
        {/* Card Top Glow Ribbon */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/80 block mb-1.5 px-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                <User size={18} strokeWidth={2.25} />
              </div>
              <input
                type="text"
                placeholder="Choose a username..."
                required
                className="w-full rounded-2xl py-4 pl-12 pr-4 text-sm font-extrabold text-white bg-[#060D24] border border-blue-400/35 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-[#0C1B4A] focus:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all duration-200"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/80 block mb-1.5 px-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                <Mail size={18} strokeWidth={2.25} />
              </div>
              <input
                type="email"
                placeholder="Enter your email address..."
                required
                className="w-full rounded-2xl py-4 pl-12 pr-4 text-sm font-extrabold text-white bg-[#060D24] border border-blue-400/35 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-[#0C1B4A] focus:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all duration-200"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/80 block mb-1.5 px-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                <Lock size={18} strokeWidth={2.25} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create password..."
                required
                className="w-full rounded-2xl py-4 pl-12 pr-12 text-sm font-extrabold text-white bg-[#060D24] border border-blue-400/35 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-[#0C1B4A] focus:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all duration-200"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Invite Code */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/80 block mb-1.5 px-1">
              Invite Code (Optional)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                <Gift size={18} strokeWidth={2.25} />
              </div>
              <input
                type="text"
                placeholder="e.g. STERLING"
                className="w-full rounded-2xl py-4 pl-12 pr-4 text-sm font-extrabold text-white bg-[#060D24] border border-blue-400/35 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-[#0C1B4A] focus:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all duration-200"
                value={formData.inviteCode}
                onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] mt-3 transition-all duration-200 disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2 border border-blue-300/40"
            style={{
              background: "linear-gradient(135deg, #0F2573 0%, #1E40AF 50%, #2563EB 100%)",
            }}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <span>CREATE ACCOUNT</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent my-6" />

        {/* Sign In Link */}
        <p className="text-center text-xs text-blue-200/80 font-bold">
          Already a member?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-cyan-300 font-black uppercase tracking-widest hover:text-cyan-200 transition-colors ml-1 underline underline-offset-4 cursor-pointer"
          >
            SIGN IN
          </button>
        </p>
      </div>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-4 mt-6 text-[10px] font-black uppercase tracking-widest text-blue-300/70">
        <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-400" /> Encrypted</span>
        <span>•</span>
        <span className="flex items-center gap-1"><Sparkles size={13} className="text-amber-400" /> Instant</span>
        <span>•</span>
        <span>Global Hub</span>
      </div>

      {/* Floating Support Button for Visitors */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowSupportModal(true)}
        className="fixed bottom-6 right-6 z-40 h-14 px-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-[0_8px_25px_rgba(37,99,235,0.4)] border border-white/30 flex items-center gap-2.5 cursor-pointer"
      >
        <div className="relative">
          <MessageSquare size={20} strokeWidth={2.25} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        </div>
        <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Support</span>
      </motion.button>

      {/* UNAUTHENTICATED PUBLIC SUPPORT MODAL */}
      <AnimatePresence>
        {showSupportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-[32px] p-6 sm:p-8 relative bg-gradient-to-b from-[#0F1E4A] via-[#0A1435] to-[#060D26] border-2 border-blue-400/40 shadow-[0_0_60px_rgba(37,99,235,0.3)] text-white overflow-hidden"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-cyan-300 flex items-center justify-center shadow-inner">
                    <MessageSquare size={22} strokeWidth={2.25} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white leading-snug">Sterling Support</h3>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Direct Customer Assistance</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="h-8 w-8 rounded-full bg-blue-950/60 border border-blue-400/30 text-blue-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              <p className="text-xs font-semibold text-blue-200/80 mb-5 leading-relaxed">
                No sign up required! Enter your email address and your message below. Our support team will receive it immediately and reply to your email.
              </p>

              <form onSubmit={handleSendPublicSupport} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-cyan-300/80 block mb-1.5 px-1">Your Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@gmail.com"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full rounded-2xl py-3.5 px-4 bg-[#030716] border border-blue-400/30 text-white font-bold text-xs focus:outline-none focus:border-cyan-400 shadow-inner placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-cyan-300/80 block mb-1.5 px-1">Message for Support Team</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your issue or question here..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full rounded-2xl py-3.5 px-4 bg-[#030716] border border-blue-400/30 text-white font-bold text-xs focus:outline-none focus:border-cyan-400 shadow-inner placeholder:text-slate-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingSupport}
                  className="btn-blue w-full py-4 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg text-white disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {sendingSupport ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      <span>Send Support Message</span>
                      <Send size={15} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Register() {
  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 font-sans"
      style={{
        background: "radial-gradient(circle at 50% 0%, #17378B 0%, #0A1435 55%, #040817 100%)"
      }}
    >
      {/* Animated Background Mesh Glow Orbs */}
      <div className="absolute -top-32 -right-32 w-[550px] h-[550px] bg-blue-600/25 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -left-32 w-[450px] h-[450px] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* Top Laser Shimmer */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38BDF8]" />

      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        </div>
      }>
        <RegisterContent />
      </Suspense>
    </div>
  );
}
