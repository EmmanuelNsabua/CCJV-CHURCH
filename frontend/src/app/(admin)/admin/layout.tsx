import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ToastProvider } from "@/components/admin/feedback/ToastContext";
import { AdminShell } from "@/components/admin/layout/AdminShell";

export const metadata: Metadata = {
  title: "Administration — CCJV-CHURCH",
  description: "Portail d'administration du Centre Chrétien Jésus ma Vie",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AdminShell>{children}</AdminShell>
      </ToastProvider>
    </AuthProvider>
  );
}
