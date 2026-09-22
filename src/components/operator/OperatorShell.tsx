"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, CalendarCheck, User, Ship, LogOut, ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function OperatorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden">
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><Ship className="w-5 h-5 text-white" /></div><div><p className="text-sm font-bold text-slate-900 dark:text-white">Mi Embarcación</p><p className="text-[10px] text-slate-500 uppercase font-bold">Operador</p></div></div><button type="button" onClick={logout} aria-label="Cerrar sesión" className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center"><LogOut className="w-4 h-4 text-slate-600" /></button></header>
    <main className="flex-1 overflow-y-auto pb-24 relative">{children}</main>
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto"><div className="flex justify-around items-center h-16 px-2">
      <Link href="/operator" aria-current={pathname === "/operator" ? "page" : undefined} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/operator" ? "text-blue-600" : "text-slate-400"}`}><Home className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Inicio</span></Link>
      <Link href="/operator/availability" aria-current={pathname === "/operator/availability" ? "page" : undefined} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/operator/availability" ? "text-blue-600" : "text-slate-400"}`}><CalendarCheck className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Cupos</span></Link>
      <Link href="/operator/redeem" aria-current={pathname === "/operator/redeem" ? "page" : undefined} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/operator/redeem" ? "text-blue-600" : "text-slate-400"}`}><ScanLine className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Redimir</span></Link>
      <button type="button" onClick={logout} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-red-500"><User className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Salir</span></button>
    </div></nav>
  </div>;
}
