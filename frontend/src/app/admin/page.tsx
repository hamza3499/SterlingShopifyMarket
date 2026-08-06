"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Wallet, MessageSquare, CheckCircle2, XCircle,
  Search, TrendingUp, LogOut, RefreshCw, ArrowUpRight,
  ArrowDownLeft, Crown, AlertCircle, Package, Share2, Eye,
  ExternalLink, Copy, Edit2, Smartphone, Bell, Clock, Briefcase, ShieldCheck, ShieldAlert, Key, UserPlus, Trash2, Plus, Minus, Layers, ClipboardCheck, DollarSign, Sparkles, Activity, Shield
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { QRCodeCanvas } from "qrcode.react";

const TAB = ({ label, icon: Icon, active, onClick, badge }: any) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 sm:px-3 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer w-full text-center border ${
      active
        ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white border-blue-300/80 shadow-[0_6px_24px_rgba(37,99,235,0.5)] scale-[1.03] z-10"
        : "bg-[#0F1E4A]/80 text-blue-100/90 border-blue-800/50 hover:bg-blue-900/60 hover:border-blue-500/50 hover:text-white"
    }`}
  >
    {Icon && <Icon size={16} strokeWidth={2.25} className={active ? "text-white animate-pulse" : "text-blue-300/70"} />}
    <span className="truncate max-w-full">{label}</span>
    {badge > 0 && (
      <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1.5 rounded-full text-[9.5px] font-black flex items-center justify-center bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.7)] animate-pulse border border-rose-300">
        {badge}
      </span>
    )}
  </button>
);

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token, logout, setUser } = useAuthStore();
  const { notifications, setNotifications } = useAdminNotifications();
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ users: [], transactions: [], products: [], levelRequests: [], vas: [] });
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [financeTab, setFinanceTab] = useState<"deposits" | "withdrawals" | "history">("deposits");
  
  // MODALS STATE
  const [editingUser, setEditingUser] = useState<any>(null);
  const [comboUser, setComboUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ balance: 0, isTaskLocked: false, withdrawalAddress: "" });
  const [comboForms, setComboForms] = useState([{ position: 5, itemsCount: 3, price: 100, commission: 20 }]);
  const [userCombos, setUserCombos] = useState<any[]>([]);
  
  const [productTab, setProductTab] = useState<number | "combos">(1);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name: "", image: "", price: 100, commission: 20, vip_level: 1, category: "general", is_combo_item: false });
  
  const [newVA, setNewVA] = useState<any>(null);

  // OFFICIAL DEPOSIT ADDRESS MANAGEMENT STATE
  const [depositAddress, setDepositAddress] = useState<string>("TS9CkrB8Ri9qbtf4M3v4bLw9k9mK4k1qAo");
  const [updatingDepositAddr, setUpdatingDepositAddr] = useState(false);

  useEffect(() => {
    api.get("/admin/deposit-address").then((res) => {
      if (res.data?.address) setDepositAddress(res.data.address);
    }).catch(() => {});
  }, []);

  const handleUpdateDepositAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) { toast.error("Unauthorized: Edit Permission Required"); return; }
    if (!depositAddress || depositAddress.trim().length < 10) {
      toast.error("Please enter a valid wallet address"); return;
    }
    setUpdatingDepositAddr(true);
    try {
      const { data } = await api.put("/admin/deposit-address", { address: depositAddress });
      if (data.success) {
        toast.success("Official Deposit Address updated!");
        setDepositAddress(data.address);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update deposit address");
    } finally {
      setUpdatingDepositAddr(false);
    }
  };

  // PERMISSION LOGIC
  const isVA = user?.role === 'va';
  const isMasterAdmin = !isVA || user?.role === 'admin' || user?.email?.toLowerCase().includes('admin') || user?.username?.toLowerCase().includes('admin');
  const vaPermissions = (user as any)?.permissions || {};
  
  const canEdit = isMasterAdmin || vaPermissions.can_edit;
  const canResetTasks = isMasterAdmin || vaPermissions.can_reset_tasks;
  const canApproveRequests = isMasterAdmin || vaPermissions.can_approve_requests;
  const canApproveFinance = isMasterAdmin || vaPermissions.can_approve_finance;
  const canCombo = isMasterAdmin || vaPermissions.can_combo;

  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        name: editingProduct.name || "",
        image: editingProduct.image || editingProduct.image_url || "",
        price: editingProduct.price || 100,
        commission: editingProduct.commission_rate || editingProduct.commission || 20,
        vip_level: editingProduct.vip_level || 1,
        category: editingProduct.category || "general",
        is_combo_item: editingProduct.is_combo_item || false
      });
      setShowAddProduct(true);
    }
  }, [editingProduct]);

  useEffect(() => {
    if (editingUser) setEditForm({ 
      balance: editingUser.balance || 0, 
      isTaskLocked: editingUser.isTaskLocked || false,
      withdrawalAddress: editingUser.withdrawalAddress || ""
    });
  }, [editingUser]);

  useEffect(() => {
    if (comboUser) {
      setComboForms([{ position: 5, itemsCount: 3, price: 100, commission: 20 }]);
      api.get(`/admin/users/${comboUser._id}/combos`).then(res => setUserCombos(res.data.data)).catch(console.error);
    } else {
      setUserCombos([]);
    }
  }, [comboUser]);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchAll();
  }, [token, user?.role]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const endpoints = [
        api.get("/admin/users"),
        api.get("/admin/transactions"),
        api.get("/admin/products"),
        api.get("/admin/level-requests"),
        api.get("/admin/va"),
        api.get("/admin/chats"),
      ];

      if (isVA) {
        endpoints.push(api.get("/va-auth/me"));
      }

      const results = await Promise.allSettled(endpoints);

      const [usersRes, txRes, productsRes, levelRes, vasRes, chatsRes, meRes] = results;

      setData({
        users: usersRes.status === 'fulfilled' ? usersRes.value.data.data : [],
        transactions: txRes.status === 'fulfilled' ? txRes.value.data.data : [],
        products: productsRes.status === 'fulfilled' ? productsRes.value.data.data : [],
        levelRequests: levelRes.status === 'fulfilled' ? levelRes.value.data.data : [],
        vas: vasRes.status === 'fulfilled' ? vasRes.value.data.data : [],
        chats: chatsRes.status === 'fulfilled' ? chatsRes.value.data.data : [],
      });

      if (isVA && meRes && meRes.status === 'fulfilled') {
        setUser(meRes.value.data.data);
      }
    } catch (err: any) { 
      console.error("Fetch All Error:", err);
    } finally { setLoading(false); }
  };

  const handleTransaction = async (id: string, action: "approve" | "reject") => {
    if (!canApproveFinance) { toast.error("Unauthorized: Finance Permission Required"); return; }
    setProcessingId(id);
    try {
      const res = await api.put(`/admin/transactions/${id}`, { status: action === "approve" ? "approved" : "rejected" });
      if (res.data.success) {
        toast.success(`Transaction ${action}d successfully`);
        fetchAll();
      } else {
        toast.error(res.data.message || "Approval failed");
      }
    } catch (err: any) { 
      toast.error(err.response?.data?.message || "Failed to communicate with server"); 
    }
    finally { setProcessingId(null); }
  };

  const updateVIP = async (userId: string, vipLevel: number) => {
    if (!canEdit) { toast.error("Unauthorized: Edit Permission Required"); return; }
    try {
      await api.put(`/admin/users/${userId}`, { vipLevel });
      toast.success(`VIP ${vipLevel} Activated`);
      fetchAll();
    } catch { toast.error("Failed to update VIP"); }
  };

  const handleLevelApproval = async (userId: string, level: number, action: 'approved' | 'rejected') => {
    if (!canApproveRequests) { toast.error("Unauthorized: Request Approval Permission Required"); return; }
    try {
      const res = await api.put(`/admin/level-requests/${userId}`, { level, action });
      if (res.data.success) {
        toast.success(`VIP Level ${level} ${action}`);
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process level approval");
    }
  };

  const resetUserTasks = async (userId: string) => {
    if (!canResetTasks) { toast.error("Unauthorized: Task Permission Required"); return; }
    try {
      await api.post(`/admin/users/${userId}/refresh`);
      toast.success("Tasks reset successfully");
      fetchAll();
    } catch { toast.error("Failed to reset tasks"); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) { toast.error("Unauthorized: Edit Permission Required"); return; }
    try {
      await api.put(`/admin/users/${editingUser._id}`, editForm);
      toast.success("User updated");
      setEditingUser(null);
      fetchAll();
    } catch { toast.error("Failed to update user"); }
  };

  const handleComboSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCombo) { toast.error("Unauthorized: Combo Permission Required"); return; }
    try {
      await api.post(`/admin/users/${comboUser._id}/combo`, { combos: comboForms });
      toast.success(`${comboForms.length} Combo(s) scheduled`);
      setComboUser(null);
      fetchAll();
    } catch { toast.error("Failed to schedule combos"); }
  };

  const handleDeleteCombo = async (comboId: string) => {
    if (!canCombo) { toast.error("Unauthorized: Combo Permission Required"); return; }
    try {
      await api.delete(`/admin/users/${comboUser._id}/combos/${comboId}`);
      toast.success("Combo deleted");
      const res = await api.get(`/admin/users/${comboUser._id}/combos`);
      setUserCombos(res.data.data);
    } catch { toast.error("Failed to delete combo"); }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) { toast.error("Unauthorized: Edit Permission Required"); return; }
    try {
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, { ...productForm, image_url: productForm.image });
        toast.success("Product updated successfully");
      } else {
        await api.post("/admin/products", { ...productForm, image_url: productForm.image });
        toast.success("Product added successfully");
      }
      setShowAddProduct(false);
      setEditingProduct(null);
      setProductForm({ name: "", image: "", price: 100, commission: 20, vip_level: 1, category: "general", is_combo_item: false });
      fetchAll();
    } catch { toast.error("Failed to save product"); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!canEdit) { toast.error("Unauthorized: Edit Permission Required"); return; }
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success("Product deleted");
      fetchAll();
    } catch { toast.error("Failed to delete product"); }
  };

  const handleCreateVA = async () => {
    if (!isMasterAdmin) return;
    try {
      const { data } = await api.post("/admin/va");
      setNewVA(data.data);
      fetchAll();
      toast.success("VA Account Generated");
    } catch (err: any) { 
      toast.error(err.response?.data?.message || "Failed to create VA"); 
    }
  };

  const handleVADelete = async (vaId: string) => {
    if (!window.confirm("Permanently delete this VA account?")) return;
    try {
      await api.delete(`/admin/va/${vaId}`);
      toast.success("VA Account Deleted");
      fetchAll();
    } catch { toast.error("Failed to delete VA"); }
  };

  const handleVAStatus = async (vaId: string, action: 'approve' | 'reject') => {
    if (!isMasterAdmin) return;
    if (action === 'reject') {
       handleVADelete(vaId);
       return;
    }
    try {
      await api.put(`/admin/va/${vaId}/status`, { action });
      toast.success(`VA ${action}d`);
      fetchAll();
    } catch (err: any) { 
      toast.error(err.response?.data?.message || "Failed to approve VA"); 
    }
  };

  const toggleVAPermission = async (vaId: string, permission: string, value: boolean) => {
    if (!isMasterAdmin) return;
    try {
      await api.put(`/admin/va/${vaId}/permissions`, { [permission]: value });
      toast.success("Permission updated");
      fetchAll();
    } catch (err: any) { 
      toast.error(err.response?.data?.message || "Failed to update permission"); 
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const [lastSeenUsers, setLastSeenUsers] = useState<number>(0);
  const [lastSeenSupport, setLastSeenSupport] = useState<number>(0);

  useEffect(() => {
    const savedUsers = localStorage.getItem('lastSeenUsers');
    const savedSupport = localStorage.getItem('lastSeenSupport');
    if (savedUsers) setLastSeenUsers(parseInt(savedUsers));
    if (savedSupport) setLastSeenSupport(parseInt(savedSupport));
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      const now = Date.now();
      setLastSeenUsers(now);
      localStorage.setItem('lastSeenUsers', now.toString());
    }
    if (activeTab === 'support') {
      const now = Date.now();
      setLastSeenSupport(now);
      localStorage.setItem('lastSeenSupport', now.toString());
    }
  }, [activeTab]);

  const filteredUsers = data.users.filter((u: any) =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredProducts = data.products.filter((p: any) => 
    productTab === "combos" ? p.is_combo_item : p.vip_level === productTab && !p.is_combo_item
  );

  const pendingDeposits = data.transactions.filter((t: any) => t.status === "pending" && t.type === "deposit");
  const pendingWithdrawals = data.transactions.filter((t: any) => t.status === "pending" && t.type === "withdrawal");
  const txHistory = data.transactions.filter((t: any) => t.status !== "pending");

  const financeCount = pendingDeposits.length + pendingWithdrawals.length;
  const requestsCount = data.levelRequests.length;
  
  const supportCount = (data.chats || []).reduce((acc: number, thread: any) => {
    const lastActivity = new Date(thread.last_message_at).getTime();
    if (thread.unread_admin_count > 0 && lastActivity > lastSeenSupport) {
      return acc + thread.unread_admin_count;
    }
    return acc;
  }, 0);
  
  const newUsersCount = data.users.filter((u: any) => {
    const registrationDate = new Date(u.createdAt).getTime();
    return registrationDate > lastSeenUsers;
  }).length;

  return (
    <div className="min-h-screen luxury-bg font-sans relative overflow-hidden pb-24 pt-4">
      {/* Background Ambient Glow Orbs */}
      <div className="luxury-bg-orb w-[700px] h-[700px] -top-60 -left-60 bg-blue-500/20" />
      <div className="luxury-bg-orb w-[600px] h-[600px] top-1/2 -right-40 bg-indigo-500/20" style={{ animationDelay: "3s" }} />

      <main className="px-4 sm:px-6 space-y-6 relative z-10 max-w-7xl mx-auto">
        {/* Master Control Header Banner (Ultra Luxury Metallic Navy & Gold Gradient) */}
        <div className="bg-gradient-to-r from-[#0B1536] via-[#112255] to-[#0A1435] text-white rounded-[28px] p-5 sm:p-6 border border-blue-400/30 shadow-[0_12px_40px_rgba(10,20,53,0.4)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-13 w-13 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] font-black flex-shrink-0">
              <Crown size={24} strokeWidth={2.25} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[9px] font-black uppercase tracking-[0.25em]">
                  COMMAND CENTER ACTIVE
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isVA ? 'VA Operating' : 'Master Admin'} <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-sky-300 bg-clip-text text-transparent">Control Panel</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={fetchAll} 
              disabled={loading} 
              className="h-11 px-4 rounded-2xl flex items-center gap-2 bg-blue-900/40 border border-blue-400/30 text-blue-200 hover:text-white hover:bg-blue-800/60 transition-all cursor-pointer shadow-md text-xs font-black uppercase tracking-wider"
            >
              <RefreshCw size={17} className={loading ? "animate-spin text-amber-400" : ""} strokeWidth={2.25} />
              <span>Refresh Data</span>
            </button>
            <button 
              onClick={logout} 
              className="h-11 px-4 rounded-2xl flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer shadow-md text-xs font-black uppercase tracking-wider"
            >
              <LogOut size={17} strokeWidth={2.25} />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Premium Dark Metallic Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {/* Total Users */}
          <div className="bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border border-blue-400/30 text-white rounded-[26px] p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-blue-400 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9.5px] font-extrabold text-blue-200/80 uppercase tracking-wider">Total Users</p>
              <div className="h-8.5 w-8.5 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shadow-inner">
                <Users size={17} strokeWidth={2.25} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">{data.users.length}</h3>
            <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mt-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Pending Requests */}
          <div className="bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border border-blue-400/30 text-white rounded-[26px] p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-rose-400 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9.5px] font-extrabold text-rose-300/80 uppercase tracking-wider">Pending</p>
              <div className="h-8.5 w-8.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 flex items-center justify-center shadow-inner">
                <AlertCircle size={17} strokeWidth={2.25} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">{financeCount + requestsCount}</h3>
            <div className="w-8 h-1 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full mt-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* VA Fleet */}
          <div className="bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border border-blue-400/30 text-white rounded-[26px] p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-sky-400 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9.5px] font-extrabold text-sky-300/80 uppercase tracking-wider">VA Fleet</p>
              <div className="h-8.5 w-8.5 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-300 flex items-center justify-center shadow-inner">
                <ShieldCheck size={17} strokeWidth={2.25} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">{data.vas.length}</h3>
            <div className="w-8 h-1 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full mt-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Total Deposits */}
          <div className="bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border border-blue-400/30 text-white rounded-[26px] p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-emerald-400 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9.5px] font-extrabold text-emerald-300/80 uppercase tracking-wider">Deposits</p>
              <div className="h-8.5 w-8.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-inner">
                <ArrowUpRight size={17} strokeWidth={2.25} />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-emerald-400 tracking-tight tabular-nums">
              ${data.transactions
                .filter((t: any) => t.type === 'deposit' && t.status === 'approved')
                .reduce((sum: number, t: any) => sum + Number(t.net_amount || t.amount), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="w-8 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full mt-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Total Withdrawals */}
          <div className="bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border border-blue-400/30 text-white rounded-[26px] p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-rose-400 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9.5px] font-extrabold text-rose-300/80 uppercase tracking-wider">Withdrawals</p>
              <div className="h-8.5 w-8.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 flex items-center justify-center shadow-inner">
                <ArrowDownLeft size={17} strokeWidth={2.25} />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-rose-400 tracking-tight tabular-nums">
              ${data.transactions
                .filter((t: any) => t.type === 'withdrawal' && t.status === 'approved')
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="w-8 h-1 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full mt-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border border-amber-400/40 text-white rounded-[26px] p-4 sm:p-5 shadow-[0_8px_30px_rgba(245,158,11,0.15)] relative overflow-hidden group hover:border-amber-400 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9.5px] font-extrabold text-amber-300 uppercase tracking-wider">Revenue</p>
              <div className="h-8.5 w-8.5 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black">
                <DollarSign size={17} strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-amber-300 tracking-tight tabular-nums">
              ${data.transactions
                .filter((t: any) => t.type === 'withdrawal' && t.status === 'approved')
                .reduce((sum: number, t: any) => sum + (Number(t.amount) * 0.05), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[8.5px] font-bold text-amber-200/70 mt-1">5% fee on withdrawals</p>
          </div>
        </div>

        {/* ULTRA-LUXURY TAB CONTROL CAROUSEL GRID (No text truncation! Perfectly responsive on mobile & desktop) */}
        <div className="bg-gradient-to-br from-[#0F1E4A] via-[#0A1435] to-[#0D1B40] rounded-[26px] p-2.5 sm:p-3 border border-blue-400/30 shadow-[0_10px_35px_rgba(10,20,53,0.5)]">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
            <TAB label="USERS" icon={Users} active={activeTab === "users"} onClick={() => setActiveTab("users")} badge={newUsersCount} />
            <TAB label="FINANCE" icon={Wallet} active={activeTab === "finance"} onClick={() => setActiveTab("finance")} badge={financeCount} />
            <TAB label="REQUESTS" icon={Crown} active={activeTab === "level-requests"} onClick={() => setActiveTab("level-requests")} badge={requestsCount} />
            <TAB label="INVENTORY" icon={Package} active={activeTab === "products"} onClick={() => setActiveTab("products")} />
            <TAB label="ACCESS & TEAM" icon={ShieldCheck} active={activeTab === "vas"} onClick={() => setActiveTab("vas")} />
            <TAB label="SUPPORT" icon={MessageSquare} active={activeTab === "support"} onClick={() => { setActiveTab("support"); router.push("/admin/support"); }} badge={supportCount} />
          </div>
        </div>

        {/* Search Bar */}
        {activeTab === "users" && (
          <div className="relative">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 text-blue-300/60" size={18} strokeWidth={2.25} />
            <input 
              type="text" 
              placeholder="Search member by username or ID..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full rounded-2xl py-4 pl-12 pr-5 text-xs font-bold text-white bg-[#0F1E4A]/90 border border-blue-400/30 focus:outline-none focus:border-blue-400 shadow-lg placeholder:text-blue-200/50" 
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 rounded-full border-3 border-blue-400/30 border-t-amber-400 animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* USERS MANAGEMENT */}
            {activeTab === "users" && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {filteredUsers.map((u: any) => (
                  <div key={u._id} className="bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border border-blue-400/30 text-white rounded-[26px] p-5 sm:p-6 shadow-xl transition-all hover:border-blue-400">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-2xl flex items-center justify-center font-black text-base bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-300/40">
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-black text-white">{u.username}</p>
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[9px] font-black uppercase tracking-wider">
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-blue-200/60 uppercase tracking-wider mt-0.5">ID: {u._id?.substring(0, 8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-amber-300 tabular-nums">${(u.balance ?? 0).toFixed(2)}</p>
                        <p className="text-[10.5px] font-black text-blue-300 uppercase tracking-wider mt-0.5">VIP Tier {u.vipLevel || 1}</p>
                      </div>
                    </div>

                    {/* VIP Level Switcher */}
                    <div className="flex gap-2.5 mb-4">
                      {[1, 2, 3].map(lvl => (
                        <button 
                          key={lvl} 
                          onClick={() => updateVIP(u._id, lvl)}
                          disabled={!canEdit}
                          className={`flex-1 py-3 rounded-xl text-[10.5px] font-black uppercase transition-all shadow-md ${
                            !canEdit ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 cursor-pointer'
                          } ${
                            u.vipLevel === lvl 
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-[0_0_16px_rgba(245,158,11,0.5)] border border-amber-300' 
                              : 'bg-blue-950/60 text-blue-200 hover:bg-blue-900/80 border border-blue-800/60'
                          }`}
                        >
                          VIP {lvl}
                        </button>
                      ))}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex gap-2.5 pt-3.5 border-t border-blue-800/50">
                      <button 
                        onClick={() => setEditingUser(u)} 
                        disabled={!canEdit} 
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${
                          canEdit 
                            ? 'bg-blue-900/50 text-white border-blue-400/40 hover:bg-blue-800/80 hover:border-blue-300 shadow-sm cursor-pointer' 
                            : 'bg-blue-950/30 text-blue-400/30 border-blue-900/30 cursor-not-allowed'
                        }`}
                      >
                        Edit Profile
                      </button>
                      <button 
                        onClick={() => resetUserTasks(u._id)} 
                        disabled={!canResetTasks}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${
                          canResetTasks 
                            ? 'bg-amber-500/10 text-amber-300 border-amber-400/40 hover:bg-amber-500/20 shadow-sm cursor-pointer' 
                            : 'bg-blue-950/30 text-blue-400/30 border-blue-900/30 cursor-not-allowed'
                        }`}
                      >
                        Reset Tasks
                      </button>
                      <button 
                        onClick={() => setComboUser(u)} 
                        disabled={!canCombo}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${
                          canCombo 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30 shadow-sm cursor-pointer' 
                            : 'bg-blue-950/30 text-blue-400/30 border-blue-900/30 cursor-not-allowed'
                        }`}
                      >
                        Combo Task
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* FINANCE MANAGEMENT */}
            {activeTab === "finance" && (
              <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* OFFICIAL DEPOSIT ADDRESS CONFIGURATION CARD */}
                <div className="p-6 rounded-[28px] bg-gradient-to-b from-[#0F1E4A] via-[#0A1435] to-[#060D26] border-2 border-blue-400/40 shadow-2xl relative overflow-hidden mb-2">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="text-amber-400" size={20} />
                        <h3 className="text-base font-black text-white uppercase tracking-wider">Official Platform Deposit Address (USDT-TRC20)</h3>
                      </div>
                      <p className="text-xs font-semibold text-blue-200/80 mb-4">
                        Updating this address automatically updates the dynamic QR code for all users across the platform.
                      </p>

                      <form onSubmit={handleUpdateDepositAddress} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input 
                            type="text" 
                            value={depositAddress}
                            onChange={(e) => setDepositAddress(e.target.value)}
                            placeholder="Enter USDT-TRC20 Deposit Address..." 
                            className="flex-1 rounded-2xl py-3.5 px-4 bg-[#030716] border border-blue-400/30 text-cyan-300 font-mono font-bold text-xs focus:outline-none focus:border-cyan-400 shadow-inner"
                          />
                          <button 
                            type="submit"
                            disabled={updatingDepositAddr || !canEdit}
                            className="btn-blue py-3.5 px-6 rounded-2xl font-black uppercase text-xs tracking-wider shadow-md shrink-0 disabled:opacity-50"
                          >
                            {updatingDepositAddr ? "Saving..." : "Save Address"}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Live Generated QR Preview Canvas */}
                    <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl border border-blue-200/60 shadow-lg shrink-0">
                      <QRCodeCanvas value={depositAddress || "TS9CkrB8Ri9qbtf4M3v4bLw9k9mK4k1qAo"} size={120} />
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-600 mt-1.5">Live QR Preview</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 p-2 bg-[#0F1E4A] rounded-2xl border border-blue-400/30 shadow-md">
                  {["deposits", "withdrawals", "history"].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setFinanceTab(t as any)} 
                      className={`flex-1 py-3.5 rounded-xl text-[10.5px] font-black uppercase transition-all cursor-pointer ${
                        financeTab === t 
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border border-blue-300/40" 
                          : "text-blue-200/80 hover:text-white font-bold"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {(() => {
                  const txs = financeTab === "deposits" ? pendingDeposits : financeTab === "withdrawals" ? pendingWithdrawals : txHistory;
                  if (txs.length === 0) {
                    return (
                      <div className="py-20 text-center bg-[#0F1E4A]/80 rounded-[26px] border border-blue-400/30 p-8">
                        <p className="text-xs font-black uppercase tracking-wider text-blue-300/60">No {financeTab} transactions found</p>
                      </div>
                    );
                  }
                  return txs.map((tx: any) => (
                    <div key={tx.id} className="bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border border-blue-400/30 text-white rounded-[26px] p-5 sm:p-6 shadow-xl">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3.5">
                             <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-md ${
                               tx.type === 'deposit' ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300' : 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
                             }`}>
                               <ArrowUpRight size={20} strokeWidth={2.25} />
                             </div>
                             <div>
                               <p className="text-base font-black text-white uppercase">{tx.type}</p>
                               <p className="text-[10px] font-bold text-blue-200/60 uppercase">User: {tx.users?.username || tx.user_id?.substring(0, 8)}</p>
                             </div>
                          </div>
                          <p className="text-xl font-black text-amber-300 tabular-nums">${parseFloat(tx.amount).toFixed(2)}</p>
                       </div>
                       {tx.status === 'pending' && (
                          <div className="flex gap-3 pt-3.5 border-t border-blue-800/50">
                             <button 
                                onClick={() => handleTransaction(tx.id, "approve")} 
                                disabled={processingId === tx.id || !canApproveFinance} 
                                className={`flex-1 py-3.5 rounded-xl text-[10.5px] font-black uppercase transition-all shadow-md ${
                                  canApproveFinance 
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95 border border-emerald-400/40' 
                                    : 'bg-blue-950/40 text-blue-400/30 cursor-not-allowed'
                                }`}
                             >
                                Approve Transaction
                             </button>
                             <button 
                                onClick={() => handleTransaction(tx.id, "reject")} 
                                disabled={processingId === tx.id || !canApproveFinance}
                                className={`flex-1 py-3.5 rounded-xl text-[10.5px] font-black uppercase transition-all shadow-md ${
                                  canApproveFinance 
                                    ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-95 border border-rose-400/40' 
                                    : 'bg-blue-950/40 text-blue-400/30 cursor-not-allowed'
                                }`}
                             >
                                Reject Transaction
                             </button>
                          </div>
                       )}
                    </div>
                  ));
                })()}
              </motion.div>
            )}

            {/* PRODUCTS INVENTORY */}
            {activeTab === "products" && isMasterAdmin && (
              <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between px-1">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300/60">Merchant Store Inventory</p>
                   <button 
                      onClick={() => { setEditingProduct(null); setShowAddProduct(true); }} 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-11 px-5 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-blue-400/30"
                   >
                      <Plus size={18} strokeWidth={2.5} /> Add New Product
                   </button>
                </div>

                <div className="flex gap-2 p-2 bg-[#0F1E4A] rounded-2xl border border-blue-400/30 shadow-md">
                  {[1, 2, 3, "combos"].map(lvl => (
                    <button 
                      key={lvl} 
                      onClick={() => setProductTab(lvl as any)} 
                      className={`flex-1 py-3.5 rounded-xl text-[10.5px] font-black uppercase transition-all cursor-pointer ${
                        productTab === lvl 
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-300/40" 
                          : "text-blue-200/80 hover:text-white font-bold"
                      }`}
                    >
                      {lvl === "combos" ? "Combos" : `VIP Tier ${lvl}`}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredProducts.map((product: any) => (
                    <div key={product.id} className="h-[250px] rounded-[24px] overflow-hidden bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border border-blue-400/30 shadow-xl flex flex-col group transition-all hover:border-blue-400">
                      <div className="h-[150px] relative bg-slate-900/60 p-4 flex items-center justify-center overflow-hidden border-b border-blue-800/40">
                        <img src={product.image_url || product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                           <button onClick={() => setEditingProduct(product)} className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md hover:scale-110 transition-all cursor-pointer"><Edit2 size={15} /></button>
                           <button onClick={() => handleDeleteProduct(product.id)} className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md hover:scale-110 transition-all cursor-pointer"><Trash2 size={15} /></button>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between text-white">
                         <div>
                            <p className="text-xs font-black truncate uppercase tracking-tight text-white">{product.name}</p>
                            <p className="text-[8.5px] font-bold text-blue-200/60 uppercase tracking-wider mt-0.5">
                              {product.is_combo_item ? 'Combo Item' : `VIP Level ${product.vip_level}`}
                            </p>
                         </div>
                         <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-800/40">
                            <p className="text-xs font-black text-amber-300">${product.price}</p>
                            <p className="text-[9px] font-black text-emerald-400">+{product.commission_rate || product.commission}%</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* VA FLEET MANAGEMENT */}
            {activeTab === "vas" && isMasterAdmin && (
              <motion.div key="vas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                 <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300/60">VA Fleet Management</p>
                    <button 
                      onClick={handleCreateVA} 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-11 px-5 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-blue-400/30"
                    >
                      <UserPlus size={18} strokeWidth={2.5} /> Create VA Account
                    </button>
                 </div>
                 <div className="space-y-4">
                    {data.vas.map((va: any) => {
                        const perms = Array.isArray(va.va_permissions) ? (va.va_permissions[0] || {}) : (va.va_permissions || {});
                        return (
                          <div key={va.id} className="p-6 rounded-[28px] bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border border-blue-400/30 shadow-xl text-white">
                             <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                   <div className="h-12 w-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shadow-md">
                                      <Briefcase size={22} strokeWidth={2.25} />
                                   </div>
                                   <div>
                                      <p className="text-base font-black text-white">{va.username}</p>
                                      <p className={`text-[9.5px] font-black uppercase tracking-wider mt-0.5 ${va.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        Status: {va.status}
                                      </p>
                                   </div>
                                </div>
                                <div className="flex gap-2">
                                  {va.status === 'pending' ? (
                                    <>
                                      <button onClick={() => handleVAStatus(va.id, 'approve')} className="p-3 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-xl hover:bg-emerald-500/30 transition-colors"><CheckCircle2 size={20} /></button>
                                      <button onClick={() => handleVAStatus(va.id, 'reject')} className="p-3 bg-rose-500/20 border border-rose-400/40 text-rose-300 rounded-xl hover:bg-rose-500/30 transition-colors"><XCircle size={20} /></button>
                                    </>
                                  ) : (
                                    <button onClick={() => handleVADelete(va.id)} className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-black uppercase hover:bg-rose-500/30 transition-colors">Delete Account</button>
                                  )}
                                </div>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {['can_edit', 'can_reset_tasks', 'can_combo', 'can_approve_requests', 'can_approve_finance'].map(p => {
                                   const active = !!perms[p];
                                   return (
                                     <button 
                                        key={p} 
                                        onClick={() => toggleVAPermission(va.id, p, !active)} 
                                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between overflow-hidden cursor-pointer ${
                                          active 
                                          ? 'border-blue-400 bg-blue-600/30 shadow-md' 
                                          : 'border-blue-900/40 bg-blue-950/40 opacity-70'
                                        }`}
                                     >
                                        <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-900/50 text-blue-300'}`}>
                                            {p === 'can_combo' ? <Layers size={15} /> : 
                                             p === 'can_edit' ? <Edit2 size={15} /> :
                                             p === 'can_approve_finance' ? <Wallet size={15} /> :
                                             p === 'can_approve_requests' ? <Crown size={15} /> :
                                             <ClipboardCheck size={15} />}
                                          </div>
                                          <span className={`text-[10.5px] font-black uppercase tracking-wider ${active ? 'text-white' : 'text-blue-200/60'}`}>
                                            {p.replace('can_', '').replace(/_/g, ' ')}
                                          </span>
                                        </div>
                                        
                                        <div className={`w-8 h-4.5 rounded-full relative transition-colors ${active ? 'bg-emerald-500' : 'bg-blue-900/60'}`}>
                                          <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-sm ${active ? 'left-4' : 'left-0.5'}`} />
                                        </div>
                                     </button>
                                   );
                                })}
                             </div>
                          </div>
                        );
                    })}
                 </div>
              </motion.div>
            )}

            {/* LEVEL REQUESTS */}
            {activeTab === "level-requests" && (
              <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                 {data.levelRequests.map((req: any) => (
                    <div key={req._id} className="p-6 rounded-[28px] bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border border-blue-400/30 shadow-xl flex items-center justify-between text-white">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shadow-md">
                            <Crown size={24} strokeWidth={2.25} />
                          </div>
                          <div>
                            <p className="text-base font-black text-white">{req.username}</p>
                            <p className="text-[10px] font-bold text-blue-200/60 uppercase tracking-wider">Requesting VIP Level {req.vipLevelRequest}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                         <button 
                          onClick={() => handleLevelApproval(req._id, req.vipLevelRequest, 'approved')} 
                          disabled={!canApproveRequests}
                          className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase shadow-md transition-all ${
                            canApproveRequests ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-blue-950/40 text-blue-400/30 cursor-not-allowed'
                          }`}
                         >
                          Approve Upgrade
                         </button>
                         <button 
                          onClick={() => handleLevelApproval(req._id, req.vipLevelRequest, 'rejected')} 
                          disabled={!canApproveRequests}
                          className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase shadow-md transition-all ${
                            canApproveRequests ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:bg-rose-600/50 cursor-pointer' : 'bg-blue-950/40 text-blue-400/30 cursor-not-allowed'
                          }`}
                         >
                          Reject
                         </button>
                       </div>
                    </div>
                 ))}
                 {data.levelRequests.length === 0 && (
                   <div className="py-20 text-center bg-[#0F1E4A]/80 rounded-[26px] border border-blue-400/30 p-8">
                     <p className="text-xs font-black uppercase tracking-wider text-blue-300/60">No pending VIP upgrade requests</p>
                   </div>
                 )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {/* NEW VA MODAL */}
        {newVA && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-[36px] p-8 bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border-2 border-blue-400/50 shadow-2xl text-center text-white">
               <div className="h-18 w-18 rounded-3xl bg-blue-600 text-white mx-auto mb-5 flex items-center justify-center shadow-lg">
                  <ShieldCheck size={36} strokeWidth={2.25} />
               </div>
               <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">VA Account Created</h3>
               <p className="text-[10px] font-bold text-blue-200/60 uppercase tracking-wider mb-6">Generated Access Credentials</p>
               <div className="space-y-3.5 mb-6">
                  <div className="p-4 rounded-2xl bg-blue-950/60 border border-blue-400/30 flex items-center justify-between">
                     <div className="text-left"><p className="text-[8.5px] font-black text-blue-300/60 uppercase mb-0.5">Username</p><p className="text-sm font-black text-white">{newVA.username}</p></div>
                     <button onClick={() => copyToClipboard(newVA.username)} className="p-2 text-blue-300 hover:text-white transition-colors"><Copy size={16} /></button>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-950/60 border border-blue-400/30 flex items-center justify-between">
                     <div className="text-left"><p className="text-[8.5px] font-black text-blue-300/60 uppercase mb-0.5">Generated Password</p><p className="text-sm font-black text-amber-300 tracking-wider">{newVA.password}</p></div>
                     <button onClick={() => copyToClipboard(newVA.password)} className="p-2 text-blue-300 hover:text-white transition-colors"><Copy size={16} /></button>
                  </div>
               </div>
               <p className="text-[9.5px] font-extrabold text-rose-400 uppercase tracking-wider mb-6 flex items-center justify-center gap-2 animate-pulse"><AlertCircle size={13} /> Save these details now</p>
               <button onClick={() => setNewVA(null)} className="btn-blue w-full py-4 rounded-2xl font-black uppercase tracking-wider shadow-md text-white">I Have Saved Them</button>
            </motion.div>
          </motion.div>
        )}

        {/* EDIT USER MODAL */}
        {editingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-[32px] p-8 bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border-2 border-blue-400/50 shadow-2xl text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-black uppercase text-white tracking-wider">Update User Profile</h3>
                <button onClick={() => setEditingUser(null)} className="text-blue-300/60 hover:text-white"><XCircle size={24} /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div>
                  <label className="text-[9.5px] font-black uppercase text-blue-200/70 block mb-1.5 px-1">Balance ($)</label>
                  <input type="number" step="0.01" value={editForm.balance} onChange={e => setEditForm({...editForm, balance: parseFloat(e.target.value)})} className="w-full rounded-2xl py-3.5 px-4 bg-blue-950/60 border border-blue-400/30 text-white font-black text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-[9.5px] font-black uppercase text-blue-200/70 block mb-1.5 px-1">USDT-TRC20 Wallet Address</label>
                  <input type="text" value={editForm.withdrawalAddress} onChange={e => setEditForm({...editForm, withdrawalAddress: e.target.value})} className="w-full rounded-2xl py-3.5 px-4 bg-blue-950/60 border border-blue-400/30 text-white font-bold text-xs focus:outline-none focus:border-blue-400" />
                </div>

                <button type="submit" className="btn-blue w-full py-4 rounded-2xl font-black uppercase tracking-wider shadow-md text-white">Save Changes</button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* COMBO SCHEDULER MODAL */}
        {comboUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md rounded-[32px] p-8 bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border-2 border-blue-400/50 max-h-[90vh] overflow-y-auto luxury-scrollbar shadow-2xl text-white">
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-black uppercase text-white">Combo Task Scheduler</h3>
                    <p className="text-xs font-extrabold text-amber-300 mt-0.5">User: {comboUser.username}</p>
                  </div>
                  <button onClick={() => setComboUser(null)} className="text-blue-300/60 hover:text-white"><XCircle size={24} /></button>
               </div>

               {userCombos.length > 0 && (
                 <div className="mb-6 space-y-2.5">
                   <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Active Schedules</p>
                   {userCombos.map((c, idx) => (
                     <div key={idx} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-between">
                       <div>
                         <p className="text-xs font-black text-white">Position: {c.position} | {c.items_count || c.itemsCount} Items</p>
                         <p className="text-[10px] font-bold text-emerald-300 uppercase">${c.price} | {c.commission}% Commission</p>
                       </div>
                       <button onClick={() => handleDeleteCombo(c.id)} className="p-2 text-rose-400 hover:text-rose-300"><Trash2 size={16} /></button>
                     </div>
                   ))}
                 </div>
               )}

               <form onSubmit={handleComboSubmit} className="space-y-5">
                  {comboForms.map((form, index) => (
                    <div key={index} className="p-5 rounded-[24px] bg-blue-950/60 border border-blue-400/30 space-y-4">
                       <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black uppercase text-amber-300">Combo Set #{index + 1}</span>
                         {comboForms.length > 1 && (
                           <button type="button" onClick={() => setComboForms(comboForms.filter((_, i) => i !== index))} className="text-rose-400 text-[9.5px] font-black uppercase">Remove</button>
                         )}
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <label className="text-[8.5px] font-black uppercase text-blue-200/60 block mb-1">Task Position</label>
                           <input type="number" value={form.position} onChange={e => { const n = [...comboForms]; n[index].position = parseInt(e.target.value); setComboForms(n); }} className="w-full rounded-xl py-3 px-3 text-xs font-black bg-blue-900/60 border border-blue-400/30 text-white focus:outline-none focus:border-blue-400" />
                         </div>
                         <div>
                           <label className="text-[8.5px] font-black uppercase text-blue-200/60 block mb-1">Items Count</label>
                           <input type="number" value={form.itemsCount} onChange={e => { const n = [...comboForms]; n[index].itemsCount = parseInt(e.target.value); setComboForms(n); }} className="w-full rounded-xl py-3 px-3 text-xs font-black bg-blue-900/60 border border-blue-400/30 text-white focus:outline-none focus:border-blue-400" />
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <label className="text-[8.5px] font-black uppercase text-blue-200/60 block mb-1">Price ($)</label>
                           <input type="number" value={form.price} onChange={e => { const n = [...comboForms]; n[index].price = parseFloat(e.target.value); setComboForms(n); }} className="w-full rounded-xl py-3 px-3 text-xs font-black bg-blue-900/60 border border-blue-400/30 text-white focus:outline-none focus:border-blue-400" />
                         </div>
                         <div>
                           <label className="text-[8.5px] font-black uppercase text-blue-200/60 block mb-1">Commission (%)</label>
                           <input type="number" value={form.commission} onChange={e => { const n = [...comboForms]; n[index].commission = parseFloat(e.target.value); setComboForms(n); }} className="w-full rounded-xl py-3 px-3 text-xs font-black bg-blue-900/60 border border-blue-400/30 text-white focus:outline-none focus:border-blue-400" />
                         </div>
                       </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setComboForms([...comboForms, { position: 5, itemsCount: 3, price: 100, commission: 20 }])} className="w-full py-3.5 rounded-2xl border-2 border-dashed border-blue-400/30 text-blue-200 text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-blue-400 hover:text-white transition-all cursor-pointer">
                    <Plus size={15} /> Add Another Combo
                  </button>
                  <button type="submit" className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase shadow-md cursor-pointer border border-emerald-400/40">Confirm All Schedules</button>
               </form>
            </motion.div>
          </motion.div>
        )}

        {/* ADD PRODUCT MODAL */}
        {showAddProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-[32px] p-8 bg-gradient-to-b from-[#0F1E4A] to-[#0A1435] border-2 border-blue-400/50 shadow-2xl max-h-[90vh] overflow-y-auto luxury-scrollbar text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-black uppercase text-white tracking-wider">Store Product Inventory</h3>
                <button onClick={() => setShowAddProduct(false)} className="text-blue-300/60 hover:text-white"><XCircle size={24} /></button>
              </div>
              <form onSubmit={handleProductSubmit} className="space-y-5">
                <div>
                  <label className="text-[9.5px] font-black uppercase text-blue-200/70 block mb-1.5 px-1">Product Name</label>
                  <input type="text" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full rounded-2xl py-3.5 px-4 bg-blue-950/60 border border-blue-400/30 text-white font-bold text-xs focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-[9.5px] font-black uppercase text-blue-200/70 block mb-1.5 px-1">Product Image URL</label>
                  <input type="text" required value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} className="w-full rounded-2xl py-3.5 px-4 bg-blue-950/60 border border-blue-400/30 text-white font-mono text-xs focus:outline-none focus:border-blue-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-[9.5px] font-black uppercase text-blue-200/70 block mb-1.5 px-1">Price ($)</label>
                     <input type="number" required value={productForm.price} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value)})} className="w-full rounded-2xl py-3.5 px-4 bg-blue-950/60 border border-blue-400/30 text-white font-black text-sm focus:outline-none focus:border-blue-400" />
                   </div>
                   <div>
                     <label className="text-[9.5px] font-black uppercase text-blue-200/70 block mb-1.5 px-1">Comm (%)</label>
                     <input type="number" required value={productForm.commission} onChange={e => setProductForm({...productForm, commission: parseFloat(e.target.value)})} className="w-full rounded-2xl py-3.5 px-4 bg-blue-950/60 border border-blue-400/30 text-white font-black text-sm focus:outline-none focus:border-blue-400" />
                   </div>
                </div>
                <div>
                  <label className="text-[9.5px] font-black uppercase text-blue-200/70 block mb-1.5 px-1">VIP Assignment</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3].map(lvl => (
                      <button 
                        key={lvl} 
                        type="button" 
                        onClick={() => setProductForm({...productForm, vip_level: lvl, is_combo_item: false})} 
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                          productForm.vip_level === lvl && !productForm.is_combo_item 
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md border border-amber-300' 
                            : 'bg-blue-950/60 text-blue-200 border border-blue-800/40'
                        }`}
                      >
                        VIP Tier {lvl}
                      </button>
                    ))} 
                    <button 
                      type="button" 
                      onClick={() => setProductForm({...productForm, is_combo_item: true})} 
                      className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                        productForm.is_combo_item 
                          ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/40' 
                          : 'bg-blue-950/60 text-blue-200 border border-blue-800/40'
                      }`}
                    >
                      Combo Item
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn-blue w-full py-4 rounded-2xl font-black uppercase tracking-wider shadow-md text-white mt-2">Save Product</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}