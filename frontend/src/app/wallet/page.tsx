"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowUpRight, ArrowDownLeft, Clock,
  CheckCircle, XCircle, Copy, RefreshCw, Smartphone, Image as ImageIcon,
  Wallet as WalletIcon, ShieldCheck, Sparkles, QrCode, History, Check
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BottomNav from "@/components/layout/BottomNav";

export default function Wallet() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentAddress, setPaymentAddress] = useState<string>("TS9CkrB8Ri9qbtf4M3v4bLw9k9mK4k1qAo");

  const QUICK_AMOUNTS = [50, 100, 300, 500, 1000];

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchData();
  }, [token]);

  useEffect(() => {
    if (activeTab === "withdraw" && user?.withdrawalAddress) {
      setAddress(user.withdrawalAddress);
    }
  }, [activeTab, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, txRes, addrRes] = await Promise.all([
        api.get("/user/profile"),
        api.get("/user/transactions"),
        api.get("/user/deposit-address").catch(() => ({ data: { address: "TS9CkrB8Ri9qbtf4M3v4bLw9k9mK4k1qAo" } }))
      ]);
      useAuthStore.getState().setUser(profileRes.data.data);
      setTransactions(txRes.data.data || []);
      if (addrRes.data?.address) {
        setPaymentAddress(addrRes.data.address);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Session error");
      logout(); router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(paymentAddress);
    setCopied(true);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setScreenshot(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { toast.error("Enter valid amount"); return; }
    
    if (activeTab === "deposit" && !screenshot) {
      toast.error("Please upload payment proof screenshot");
      return;
    }

    if (activeTab === "withdraw" && (!address || address.length < 10)) {
      toast.error("Please enter a valid wallet address");
      return;
    }

    if (activeTab === "withdraw" && parseFloat(amount) > (user?.balance ?? 0)) {
      toast.error("Insufficient balance");
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl = "";
      
      // 1. If deposit, upload screenshot first
      if (activeTab === "deposit" && screenshot) {
        const formData = new FormData();
        formData.append("image", screenshot);
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (uploadRes.data.success) {
          screenshotUrl = uploadRes.data.url;
        } else {
          throw new Error("Screenshot upload failed");
        }
      }

      // 2. Submit transaction request
      const payload = activeTab === "deposit" 
        ? { amount: parseFloat(amount), screenshot: screenshotUrl }
        : { amount: parseFloat(amount), address };

      await api.post(`/user/${activeTab}`, payload);
      
      toast.success(`${activeTab === "deposit" ? "Deposit" : "Withdrawal"} request submitted for verification`);
      setAmount("");
      setScreenshot(null);
      fetchData();
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error(err.response?.data?.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle size={14} className="text-emerald-600" />;
    if (status === "rejected") return <XCircle size={14} className="text-rose-500" />;
    return <Clock size={14} className="text-amber-500" />;
  };

  const statusBadgeStyle = (status: string) => {
    if (status === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-bg pb-32 font-sans relative overflow-hidden">
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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Financial Hub</p>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Vault & Wallet</h1>
        </div>

        <button 
          onClick={fetchData} 
          className="h-11 w-11 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center shadow-sm text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-all"
        >
          <RefreshCw size={18} strokeWidth={2.25} />
        </button>
      </header>

      <main className="px-5 space-y-6 relative z-10">
        {/* ========================================================
            1. ROYAL BLUE METALLIC AVAILABLE BALANCE CARD
               (PERFECT TOP PILL SPACING & ZERO OVERLAP!)
           ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] p-7 text-white relative overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(145deg, #0A1435 0%, #112560 45%, #1D4ED8 100%)",
            border: "1px solid rgba(147, 197, 253, 0.35)",
            boxShadow: "0 22px 55px rgba(15, 23, 42, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
          }}
        >
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-52 h-52 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col relative z-10 pt-1">
            {/* Top Header Row with Generous Pill Clearance */}
            <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-md shadow-sm">
                <WalletIcon size={14} className="text-cyan-300 shrink-0" />
                <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 whitespace-nowrap">
                  Available Balance
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Vault</span>
              </div>
            </div>

            {/* Big Amount */}
            <div className="mb-2 px-1">
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums leading-none drop-shadow-md">
                ${(user.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
        </motion.div>

        {/* ========================================================
            2. SEGMENTED TABS (50/50 WHITE & BLUE STYLE)
           ======================================================== */}
        <div className="bg-white/90 p-1.5 rounded-[24px] border border-slate-200/90 shadow-sm flex items-center gap-2">
          {(["deposit", "withdraw"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${
                  isActive 
                    ? "btn-blue shadow-md text-white" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                {tab === "deposit" ? <ArrowUpRight size={16} strokeWidth={2.5} /> : <ArrowDownLeft size={16} strokeWidth={2.5} />}
                <span>{tab}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================
            3. MAIN TRANSACTION FORM CARD (PERFECT SPACING & ZERO TOUCHING BORDERS)
           ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-card-soft-blue rounded-[32px] p-7 sm:p-8 relative overflow-hidden shadow-xl border border-blue-200/80"
        >
          {/* DEPOSIT QR CODE & ADDRESS VAULT */}
          {activeTab === "deposit" && (
            <div className="mb-8 space-y-5">
              <div className="text-center p-6 sm:p-7 rounded-[28px] bg-white/95 border border-blue-100/90 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-center gap-2 mb-4 text-[#1E3A8A]">
                  <QrCode size={18} className="text-blue-600" />
                  <p className="text-[11px] font-black uppercase tracking-[0.2em]">
                    Scan QR Code to Pay (USDT-TRC20)
                  </p>
                </div>

                {/* QR Code Canvas Box */}
                <div className="bg-white p-4 rounded-2xl inline-block mb-5 border border-blue-100 shadow-[0_12px_35px_rgba(37,99,235,0.15)]">
                  <QRCodeCanvas value={paymentAddress} size={175} />
                </div>
                
                {/* Official Crypto Deposit Address Vault */}
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-700">
                      Official Deposit Address
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      ● TRC-20 Network
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0A1435] border border-blue-400/30 shadow-inner flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <p className="text-xs font-mono font-bold text-[#38BDF8] break-all select-all leading-relaxed px-1">
                      {paymentAddress}
                    </p>
                    <button 
                      type="button"
                      onClick={copyAddress}
                      className="btn-blue text-[10px] font-black px-4 py-2.5 rounded-xl shadow-md shrink-0 flex items-center justify-center gap-1.5"
                    >
                      {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                      <span>{copied ? "COPIED" : "COPY ADDRESS"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORM INPUTS */}
          <form onSubmit={handleSubmit} className="space-y-6 pb-2">
            <div>
              <label className="text-[10.5px] font-black uppercase tracking-widest text-slate-500 block mb-2.5 px-1">
                {activeTab === "deposit" ? "Amount Deposited (USD)" : "Amount to Withdraw (USD)"}
              </label>
              
              {/* 3D Premium Input Container */}
              <div className="bg-white border-2 border-blue-200/80 rounded-2xl p-2.5 flex items-center gap-3 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 shadow-sm transition-all">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                  $
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-2xl font-black text-[#0F172A] tabular-nums pr-3"
                />
              </div>

              {/* Quick Amount Selector Pills */}
              <div className="flex items-center gap-2 mt-3.5 overflow-x-auto luxury-scrollbar pb-1 px-1">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">Quick:</span>
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-blue-200/80 text-blue-700 text-[11px] font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm shrink-0"
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Fee Calculation Box for Withdrawals */}
              {activeTab === "withdraw" && amount && parseFloat(amount) > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest">
                    <span className="text-slate-400">Platform Fee (5%)</span>
                    <span className="text-rose-600">-${(parseFloat(amount) * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest border-t border-slate-100 pt-2">
                    <span className="text-slate-700">Final Net Payable</span>
                    <span className="text-emerald-600 text-sm">${(parseFloat(amount) * 0.95).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* WITHDRAWAL ADDRESS INPUT */}
            {activeTab === "withdraw" && (
              <div className="space-y-2.5">
                <label className="text-[10.5px] font-black uppercase tracking-widest text-slate-500 block px-1">
                  Withdrawal Address (USDT-TRC20)
                </label>
                <div className="bg-white border-2 border-blue-200/80 rounded-2xl p-2.5 flex items-center gap-3 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 shadow-sm transition-all">
                  <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Smartphone size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Paste your TRC20 address"
                    value={address}
                    readOnly={!!user?.withdrawalAddress}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 pr-3 ${
                      user?.withdrawalAddress ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                {user?.withdrawalAddress && (
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mt-1">
                    🔒 Wallet address is locked. Contact support to update.
                  </p>
                )}
              </div>
            )}

            {/* UPLOAD PAYMENT SCREENSHOT DROPZONE (PERFECT OPTICAL CENTERING & ZERO BORDER TOUCHING!) */}
            {activeTab === "deposit" && (
              <div className="space-y-3">
                <label className="text-[10.5px] font-black uppercase tracking-widest text-slate-500 block px-1">
                  Upload Payment Screenshot
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <label
                    htmlFor="screenshot-upload"
                    className="flex flex-col items-center justify-center py-8 px-6 rounded-[26px] border-2 border-dashed border-blue-300/90 bg-gradient-to-b from-blue-50/80 via-white to-blue-50/40 hover:bg-blue-100/50 cursor-pointer transition-all group shadow-sm text-center"
                  >
                    {screenshot ? (
                      <div className="flex items-center gap-2 text-blue-700 bg-white px-4.5 py-3 rounded-xl border border-blue-200 shadow-sm">
                        <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                        <span className="text-xs font-black truncate max-w-[220px]">{screenshot.name}</span>
                      </div>
                    ) : (
                      <>
                        {/* 3D Blue Icon Box - Generous Top Clearance, No Border Touching! */}
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center mb-3.5 shadow-md group-hover:scale-105 transition-transform shrink-0">
                          <ImageIcon size={24} strokeWidth={2} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-blue-700">
                          Select Payment Screenshot
                        </span>
                        <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          PNG, JPG or WEBP (Max 5MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON WITH ZERO BOTTOM CLIPPING! */}
            <div className="pt-3">
              <button 
                type="submit" 
                disabled={submitting}
                className="btn-blue w-full py-4.5 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.15em] text-white shadow-[0_12px_32px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.01]"
              >
                {submitting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    {activeTab === "deposit" ? <ArrowUpRight size={18} strokeWidth={2.5} /> : <ArrowDownLeft size={18} strokeWidth={2.5} />}
                    <span>Submit {activeTab === "deposit" ? "Deposit" : "Withdrawal"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* ========================================================
            4. TRANSACTION HISTORY LIST
           ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#1E3A8A]">
              Transaction History
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-300/60 to-transparent ml-4" />
          </div>

          {transactions.length === 0 ? (
            <div className="luxury-card-soft-blue rounded-[30px] p-8 text-center border border-blue-200/80 shadow-md">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <History size={26} />
              </div>
              <p className="text-sm font-black text-[#0F172A] uppercase tracking-wider">
                No Transactions Recorded Yet
              </p>
              <p className="text-xs font-medium text-slate-400 mt-1">
                Your deposit and withdrawal history will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, i) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="luxury-card-white rounded-[24px] p-4.5 flex items-center justify-between border border-slate-200/90 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        tx.type === "deposit" 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                          : "bg-rose-50 text-rose-600 border-rose-200"
                      }`}
                    >
                      {tx.type === "deposit" ? <ArrowUpRight size={18} strokeWidth={2.5} /> : <ArrowDownLeft size={18} strokeWidth={2.5} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#0F172A] uppercase tracking-wider">{tx.type}</p>
                      <p className="text-[9.5px] font-bold text-slate-400 mt-0.5">
                        {new Date(tx.createdAt || tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-black tabular-nums ${tx.type === "deposit" ? "text-emerald-600" : "text-rose-600"}`}>
                      {tx.type === "deposit" ? "+" : "-"}${parseFloat(tx.amount).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 ${statusBadgeStyle(tx.status)}`}>
                        {statusIcon(tx.status)}
                        <span>{tx.status}</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}