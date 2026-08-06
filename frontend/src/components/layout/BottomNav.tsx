"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, CheckSquare, Wallet, User } from "lucide-react";

const navItems = [
  { icon: Home,        label: "Hub",     path: "/dashboard" },
  { icon: CheckSquare, label: "Tasks",   path: "/tasks"     },
  { icon: Wallet,      label: "Wallet",  path: "/wallet"    },
  { icon: User,        label: "Profile", path: "/profile"   },
];

export default function BottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Electric Sapphire Shimmer Line */}
      <div className="h-[1.5px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

      <div
        className="px-3 pt-2.5 pb-3.5 safe-bottom"
        style={{
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(240, 247, 255, 0.98) 100%)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderTop: "1.5px solid rgba(37, 99, 235, 0.22)",
          boxShadow: "0 -10px 38px rgba(30, 64, 175, 0.14)",
        }}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname?.startsWith(item.path + "/");
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="relative flex flex-col items-center justify-center gap-1 px-4 py-2 group rounded-2xl cursor-pointer"
                style={{ minWidth: 64, minHeight: 56, touchAction: "manipulation" }}
              >
                {/* Active Electric Sapphire Gradient Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: "linear-gradient(135deg, #0A1435 0%, #162F78 50%, #2563EB 100%)",
                      boxShadow: "0 8px 24px rgba(37, 99, 235, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
                      border: "1px solid rgba(147, 197, 253, 0.4)",
                    }}
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}

                <div
                  className={`relative z-10 transition-all duration-300 ${
                    isActive
                      ? "text-white scale-110"
                      : "text-slate-400 group-hover:text-blue-600"
                  }`}
                >
                  <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>

                <span
                  className={`relative z-10 text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-blue-700"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
