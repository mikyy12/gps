"use client";

import Link from "next/link";
import { Ship, Search, CalendarDays, User, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AgencyShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const nav = (mobile = false) => (
    <>
      <Link href="/agency" onClick={() => mobile && setIsMobileMenuOpen(false)} aria-current={pathname === "/agency" ? "page" : undefined} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${pathname === "/agency" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}><Search className="w-4 h-4" />Buscar Cupos</Link>
      <Link href="/agency/reservations" onClick={() => mobile && setIsMobileMenuOpen(false)} aria-current={pathname === "/agency/reservations" ? "page" : undefined} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${pathname === "/agency/reservations" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}><CalendarDays className="w-4 h-4" />Mis Reservas</Link>
    </>
  );

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-16">
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"><Ship className="w-6 h-6 text-white" /></div><div><p className="font-bold text-slate-900 dark:text-white leading-none">Galapagos System</p><p className="text-[10px] uppercase font-bold tracking-widest text-primary">Portal Agencia</p></div></div>
        <nav className="hidden md:flex items-center gap-1">{nav()}</nav>
        <div className="hidden md:flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4"><User className="w-8 h-8 p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500" /><div className="text-sm"><p className="font-bold text-slate-900 dark:text-white">Mi cuenta</p><p className="text-slate-500 text-xs">Agencia</p></div><button type="button" onClick={logout} aria-label="Cerrar sesión" className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-red-500 rounded-xl"><LogOut className="w-5 h-5" /></button></div>
        <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Abrir menú" aria-expanded={isMobileMenuOpen} className="md:hidden w-11 h-11 flex items-center justify-center"><Menu className="w-6 h-6" /></button>
      </div></div>
      {isMobileMenuOpen && <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2">{nav(true)}<button type="button" onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 font-medium"><LogOut className="w-5 h-5" />Cerrar Sesión</button></div>}
    </header>
    <main className="flex-1 w-full">{children}</main>
  </div>;
}
