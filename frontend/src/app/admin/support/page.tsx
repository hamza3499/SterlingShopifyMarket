"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, CheckCircle2, MessageSquare,
  User as UserIcon, ShieldCheck, Clock, ArrowLeft, RefreshCw, Crown, Sparkles, Activity, Bell
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

interface Thread {
  id: string;
  user_id: string;
  status: "open" | "resolved";
  unread_admin_count: number;
  last_message_at: string;
  users?: { username: string; vip_level: number };
}

interface Message {
  id: string;
  user_id?: string;
  message: string;
  sender?: "user" | "admin";
  sender_type?: "user" | "admin";
  created_at: string;
  is_read: boolean;
}

export default function AdminSupport() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      if (token && !user) {
        try {
          const { data } = await api.get("/va-auth/me");
          if (data.success) {
            useAuthStore.getState().setUser(data.data);
          } else {
            router.push("/login");
          }
        } catch {
          router.push("/login");
        }
      }
    };
    init();
  }, [token, user, router]);

  const fetchMessages = async (threadId: string) => {
    try {
      setMsgLoading(true);
      const { data } = await api.get(`/admin/chats/${threadId}/messages`);
      if (data.success) {
        setMessages(data.data || []);
        setThreads(p => p.map(t => t.id === threadId ? { ...t, unread_admin_count: 0 } : t));
      }
    } catch (err: any) { 
      toast.error("Failed to load conversation messages"); 
      if (err.response?.status === 401) {
        useAuthStore.getState().logout();
        router.push("/login");
      }
    } finally { 
      setMsgLoading(false); 
    }
  };

  const fetchThreads = async (autoSelect: boolean = false) => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/chats");
      if (data.success && data.data) {
        setThreads(data.data);
        if ((autoSelect || !selectedThread) && data.data.length > 0) {
          const first = data.data[0];
          setSelectedThread(first);
          fetchMessages(first.id);
        }
      }
    } catch (err: any) { 
      toast.error("Failed to load chat threads");
      if (err.response?.status === 401) {
        useAuthStore.getState().logout();
        router.push("/login");
      }
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (user !== null) {
      const isAuthorized = user?.role === "admin" || user?.role === "va";
      if (!isAuthorized) { router.push("/login"); return; }
      
      fetchThreads(true);

      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5001";
      socketRef.current = io(socketUrl);
      socketRef.current.on("connect", () => { 
        socketRef.current?.emit("join_admin_room"); 
      });

      socketRef.current.on("new_support_message", (data: any) => {
        setThreads((prev) => {
          const idx = prev.findIndex(t => t.id === data.threadId);
          if (idx === -1) { 
            fetchThreads(false); 
            return prev; 
          }
          const next = [...prev];
          next[idx] = { 
            ...next[idx], 
            last_message_at: data.message.created_at, 
            unread_admin_count: (next[idx].unread_admin_count || 0) + 1 
          };
          const [t] = next.splice(idx, 1);
          return [t, ...next];
        });

        setSelectedThread(curr => {
          if (curr?.id === data.threadId) {
            setMessages(p => [...p, data.message]);
          }
          return curr;
        });
      });
    }

    return () => { 
      socketRef.current?.disconnect(); 
    };
  }, [token, user, router]);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);

  const handleSelectThread = (thread: Thread) => {
    setSelectedThread(thread);
    fetchMessages(thread.id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;
    const content = newMessage.trim();
    setNewMessage("");
    try {
      const { data } = await api.post(`/admin/chats/${selectedThread.id}/message`, { message: content });
      if (data.success) {
        setMessages(p => [...p, data.data]);
        setThreads(p => p.map(t => t.id === selectedThread.id ? { ...t, last_message_at: new Date().toISOString() } : t));
      }
    } catch { 
      toast.error("Failed to send reply"); 
      setNewMessage(content); 
    }
  };

  const toggleResolve = async () => {
    if (!selectedThread) return;
    const newStatus = selectedThread.status === "open" ? "resolved" : "open";
    try {
      const { data } = await api.put(`/admin/chats/${selectedThread.id}/resolve`, { status: newStatus });
      if (data.success) {
        setSelectedThread({ ...selectedThread, status: newStatus });
        setThreads(p => p.map(t => t.id === selectedThread.id ? { ...t, status: newStatus } : t));
        toast.success(`Marked thread as ${newStatus}`);
      }
    } catch { 
      toast.error("Failed to update status"); 
    }
  };

  const filtered = threads.filter(t => 
    (t.users?.username || 'Guest').toLowerCase().includes(search.toLowerCase()) ||
    t.user_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div 
      className="min-h-screen font-sans pb-16 pt-6 sm:pt-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #F0F7FF 100%)"
      }}
    >
      {/* Background Ambient Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-blue-300/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[450px] h-[450px] bg-sky-200/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Blue Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-sm" />

      {/* TOP NAVIGATION BAR FOR ADMIN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-4 flex items-center justify-between relative z-10">
        <button
          onClick={() => router.push("/admin")}
          className="px-4 py-2.5 rounded-2xl bg-white border border-blue-200/90 text-blue-700 hover:bg-blue-50 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <ArrowLeft size={17} strokeWidth={2.5} />
          <span>Back to Admin Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Live Member Support Hub</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-5 h-[calc(100vh-140px)] min-h-[620px] relative z-10">
        
        {/* ========================================================
            LEFT COLUMN: MEMBER CONVERSATIONS LIST (LIGHT BLUE / WHITE)
           ======================================================== */}
        <div className="w-full lg:w-96 flex flex-col rounded-[28px] border border-blue-200/90 shadow-xl overflow-hidden bg-white/95 backdrop-blur-2xl">
          {/* Header */}
          <div className="p-4 sm:p-5 space-y-3.5 border-b border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white shadow-md">
                  <MessageSquare size={20} strokeWidth={2.25} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[9.5px] font-black uppercase tracking-[0.2em] text-blue-600">Support Console</p>
                  </div>
                  <h1 className="font-black text-sm uppercase tracking-wider text-[#0F172A]">Conversations</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => fetchThreads(false)}
                  disabled={loading}
                  className="h-9 w-9 rounded-2xl flex items-center justify-center bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Refresh Conversations"
                >
                  <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} strokeWidth={2.25} />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} strokeWidth={2.25} />
              <input 
                type="text" 
                placeholder="Search member or user ID..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 shadow-inner placeholder:text-slate-400" 
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto luxury-scrollbar p-2.5 space-y-2 bg-[#F8FAFC]">
            {loading ? (
              <div className="p-10 flex justify-center">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 my-4 space-y-2 text-slate-800">
                <MessageSquare className="w-8 h-8 mx-auto text-blue-400" strokeWidth={1.75} />
                <p className="text-xs font-black uppercase tracking-wider text-slate-600">No active conversations</p>
                <p className="text-[10.5px] font-medium text-slate-400">Member support requests will appear here live.</p>
              </div>
            ) : (
              filtered.map(thread => {
                const isSelected = selectedThread?.id === thread.id;
                const username = thread.users?.username || "Member User";
                const vipLevel = thread.users?.vip_level || 1;

                return (
                  <button 
                    key={thread.id} 
                    onClick={() => handleSelectThread(thread)}
                    className={`w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left relative cursor-pointer border ${
                      isSelected 
                        ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white border-blue-600 shadow-md scale-[1.01]" 
                        : thread.unread_admin_count > 0 
                          ? "bg-emerald-50 border-emerald-300 text-slate-900 shadow-sm" 
                          : "bg-white hover:bg-blue-50/60 border-slate-200 text-slate-800 shadow-xs"
                    }`}
                  >
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm ${
                      isSelected ? "bg-white/20 text-white" : "bg-blue-600 text-white"
                    }`}>
                      {username[0]?.toUpperCase() || "U"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black truncate ${isSelected ? "text-white" : "text-[#0F172A]"}`}>
                          {username}
                        </span>
                        <span className={`text-[9.5px] font-extrabold flex-shrink-0 ml-1.5 ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                          {new Date(thread.last_message_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9.5px] font-black uppercase tracking-wider ${isSelected ? "text-blue-200" : "text-blue-600"}`}>
                          VIP Tier {vipLevel}
                        </span>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          thread.status === "open" ? (isSelected ? "bg-emerald-300" : "bg-emerald-500 animate-pulse") : "bg-slate-300"
                        }`} />
                      </div>
                    </div>

                    {thread.unread_admin_count > 0 && (
                      <span className="h-5 min-w-[20px] px-1 rounded-full text-[9px] font-black flex items-center justify-center bg-rose-500 text-white shadow-sm animate-pulse border border-rose-300">
                        {thread.unread_admin_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: ACTIVE CHAT MESSAGING WORKSPACE (LIGHT BLUE / WHITE)
           ======================================================== */}
        <div className="flex-1 rounded-[28px] border border-blue-200/90 shadow-xl flex flex-col overflow-hidden bg-white/95 backdrop-blur-2xl">
          {!selectedThread ? (
            <div className="text-center p-8 space-y-4 my-auto text-slate-800">
              <div className="h-20 w-20 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <MessageSquare size={38} strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="font-black text-base uppercase tracking-wider text-[#0F172A]">Select Member Conversation</h3>
                <p className="text-xs font-semibold text-slate-400 max-w-[280px] mx-auto mt-1">
                  Choose a member thread from the left menu to open live support messaging.
                </p>
              </div>
              <div className="pt-4 flex justify-center gap-3">
                <button 
                  onClick={() => fetchThreads(true)} 
                  className="btn-blue px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-2 text-white cursor-pointer"
                >
                  <RefreshCw size={15} strokeWidth={2.25} /> Refresh Chats
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Active Chat Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50/70 via-white to-sky-50/50 shadow-xs z-10">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white shadow-md">
                    <UserIcon size={22} strokeWidth={2.25} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-base text-[#0F172A]">{selectedThread.users?.username || "Member User"}</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-[9px] font-black uppercase tracking-wider">
                        VIP Tier {selectedThread.users?.vip_level || 1}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      User ID: {selectedThread.user_id?.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={toggleResolve}
                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                    selectedThread.status === "open"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      : "bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  <CheckCircle2 size={15} strokeWidth={2.5} />
                  {selectedThread.status === "open" ? "Mark Resolved" : "Reopen Session"}
                </button>
              </div>

              {/* Chat Message Scroll Box */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 luxury-scrollbar bg-[#F8FAFC]">
                {msgLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-bold text-xs">No messages in this conversation yet.</div>
                ) : (
                  messages.map((msg: any, i: number) => {
                    const isAdminMsg = (msg.sender || msg.sender_type) === "admin";
                    return (
                      <div key={msg.id || i} className={`flex ${isAdminMsg ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] px-5 py-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                          isAdminMsg 
                            ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-br-xs" 
                            : "bg-white border border-slate-200 text-[#0F172A] rounded-bl-xs shadow-xs"
                        }`}>
                          {!isAdminMsg && (
                            <div className="flex items-center gap-1.5 mb-1 text-blue-700">
                              <UserIcon size={11} strokeWidth={2.5} />
                              <span className="text-[8.5px] font-black uppercase tracking-wider">{selectedThread.users?.username || 'User'}</span>
                            </div>
                          )}
                          {isAdminMsg && (
                            <div className="flex items-center gap-1.5 mb-1 text-blue-100 text-right justify-end">
                              <ShieldCheck size={11} strokeWidth={2.5} />
                              <span className="text-[8.5px] font-black uppercase tracking-wider">Official Admin Reply</span>
                            </div>
                          )}
                          <p className="text-xs font-bold leading-relaxed">{msg.message}</p>
                          <p className={`text-[8.5px] font-extrabold mt-1.5 uppercase tracking-wider ${isAdminMsg ? "text-blue-100 text-right" : "text-slate-400 text-left"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Reply Footer Input */}
              <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleSend} className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Type official admin reply..." 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 rounded-2xl py-3.5 px-4 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-400 shadow-inner" 
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="h-11 px-5 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 btn-blue text-white font-black shadow-md cursor-pointer"
                  >
                    <Send size={17} strokeWidth={2.5} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

      </main>
    </div>
  );
}
