"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, User as UserIcon, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

interface Message {
  id: string;
  message: string;
  sender_type: "user" | "admin" | "system";
  created_at: string;
}

export default function SupportWidget() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hide widget only on admin pages, login, register, and splash screen
  const isHidden = pathname.startsWith("/admin") || pathname === "/login" || pathname === "/register" || pathname === "/";

  useEffect(() => {
    if (!token || !user || isHidden) return;

    if (isOpen && messages.length === 0) {
      fetchThread();
    }

    if (!socketRef.current) {
      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
      socketRef.current = io(socketUrl);
      socketRef.current.on("connect", () => {
        socketRef.current?.emit("join_user_room", user._id);
      });
      socketRef.current.on("receive_support_message", (data: any) => {
        setMessages((prev) => [...prev, data]);
        if (!isOpen) {
          toast("New support message", { icon: "💬" });
        }
      });
    }
  }, [token, user, isHidden, isOpen]);

  useEffect(() => {
    if (searchParams.get("chat") === "true") {
      setIsOpen(true);
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/chat/thread");
      if (data.success && data.data) {
        setMessages(data.data.messages || []);
      }
    } catch (err: any) {
      console.error("Failed to load chat", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    const msgText = newMessage.trim();
    setNewMessage("");

    const tempMsg: Message = {
      id: Date.now().toString(),
      message: msgText,
      sender_type: "user",
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data } = await api.post("/chat/message", { message: msgText });
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.data : m));
      }
    } catch (err) {
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };

  if (isHidden) return null;

  return (
    <>
      {/* Premium Floating Support Chat Button (PROMINENT & HIGH Z-INDEX FLOATING ABOVE BOTTOM NAV) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            className="fixed z-[99] h-16 w-16 rounded-full flex items-center justify-center shadow-[0_12px_36px_rgba(37,99,235,0.6)] border-2 border-white/60 cursor-pointer"
            style={{ 
              bottom: "96px",
              right: "20px",
              background: "linear-gradient(135deg, #0A1435 0%, #1D4ED8 50%, #38BDF8 100%)",
            }}
          >
            <MessageSquare size={26} className="text-white drop-shadow-md" strokeWidth={2.25} />
            <span className="absolute top-0 right-0 h-4.5 w-4.5 rounded-full bg-emerald-400 border-2 border-white animate-pulse shadow-sm" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-[100] w-[92vw] max-w-[370px] h-[530px] max-h-[78vh] rounded-[30px] flex flex-col overflow-hidden shadow-2xl bg-white border-2 border-blue-200/90"
            style={{
              bottom: "100px",
              right: "16px",
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50/80 to-white relative">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-blue-600 text-white shadow-md">
                  <ShieldCheck size={22} strokeWidth={2.25} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">Live Support</h3>
                  <p className="text-[9.5px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online Agent
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 luxury-scrollbar bg-[#F8FAFC]">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="h-13 w-13 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3 shadow-inner">
                    <MessageSquare size={26} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#0F172A]">How can we help you?</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1">Send a message below and our official support team will assist you immediately.</p>
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isUser = (msg.sender || msg.sender_type) === "user";
                  return (
                    <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        isUser 
                          ? "bg-blue-600 text-white rounded-br-sm" 
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                      }`}>
                        {!isUser && (
                          <div className="flex items-center gap-1.5 mb-1 text-blue-700">
                            <ShieldCheck size={11} strokeWidth={2.5} />
                            <span className="text-[8.5px] font-black uppercase tracking-wider">Official Support</span>
                          </div>
                        )}
                        <p className="text-xs font-medium leading-relaxed">
                          {msg.message}
                        </p>
                        <p className={`text-[8px] font-extrabold mt-1.5 uppercase tracking-wider ${isUser ? "text-blue-200" : "text-slate-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-blue-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs font-bold rounded-2xl py-3.5 pl-4 pr-12 focus:outline-none border border-slate-200 focus:border-blue-500 transition-colors placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-1.5 h-9 w-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 btn-blue text-white shadow-md"
                >
                  <Send size={15} strokeWidth={2.5} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
