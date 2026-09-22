"use client";

import { Bell, Search, Menu } from "lucide-react";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="glass sticky top-0 z-10 mb-6 flex h-16 items-center justify-between border-b border-slate-200/60 px-3 dark:border-slate-800/60 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenuClick} type="button" aria-label="Abrir menú de navegación" className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all duration-300 hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"><Menu className="h-5 w-5" /></button>
        <div className="group relative hidden md:flex">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
          <input type="search" aria-label="Buscar en el panel" placeholder="Buscar…" className="w-64 rounded-full border border-transparent bg-slate-100/70 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:bg-slate-800/70 dark:text-white dark:focus:bg-slate-900" />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" aria-label="Ver notificaciones" className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-all duration-300 hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:hover:bg-slate-800 dark:hover:text-white"><Bell className="h-5 w-5" /><span aria-hidden="true" className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 dark:border-slate-900" /></button>
        <div aria-hidden="true" className="h-9 w-9 rounded-full border-2 border-white bg-linear-to-tr from-indigo-500 to-purple-500 shadow-md dark:border-slate-800" />
      </div>
    </header>
  );
}
