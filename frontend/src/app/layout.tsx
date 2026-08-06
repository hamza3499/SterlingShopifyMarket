import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/Header";
import SupportWidget from "@/components/chat/SupportWidget";
import { Suspense } from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1A6BF0",
};

export const metadata: Metadata = {
  title: "Sterling Shopify Market | Global Hub",
  description: "A premium VIP e-commerce fintech platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-[#F8FAFC] text-slate-800 antialiased overflow-x-hidden">
        <Header />
        {children}
        <Suspense fallback={null}>
          <SupportWidget />
        </Suspense>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              color: "#1E293B",
              border: "1px solid rgba(59,130,246,0.25)",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "0.02em",
              boxShadow: "0 8px 32px rgba(30,64,175,0.12)",
            },
            success: {
              iconTheme: { primary: "#1A6BF0", secondary: "#FFFFFF" },
            },
            error: {
              iconTheme: { primary: "#EF4444", secondary: "#FFFFFF" },
            },
          }}
        />
      </body>
    </html>
  );
}
