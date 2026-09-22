"use client";

import Link from "next/link";
import { ArrowRight, Anchor, CalendarDays, CheckCircle2, Ship } from "lucide-react";

export default function OperatorDashboard() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-24">
      <div className="pt-2">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider">
          <Ship className="w-4 h-4" /> Panel operativo
        </span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-3">¡Hola, Capitán! 👋</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Gestiona tus próximas salidas y mantén los cupos actualizados.</p>
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/20">
        <div className="absolute -top-16 -right-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <Anchor className="absolute -bottom-5 -right-5 h-32 w-32 text-white/10" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur-md">
            <CalendarDays className="w-4 h-4" /> Próximas salidas
          </span>
          <h2 className="mt-5 text-2xl font-black">Consulta tu disponibilidad</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-blue-100">Aquí verás las salidas y cupos registrados en el sistema. Usa el gestor para actualizar la disponibilidad real de cada embarcación.</p>
          <Link href="/operator/availability" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-bold text-blue-700 shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-blue-50 active:scale-95">
            Gestionar cupos <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Disponibilidad controlada</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">Los cambios de cupos se validan contra las reservas existentes antes de guardarse.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <Ship className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-600" />
        <h3 className="mt-3 font-bold text-slate-900 dark:text-white">Sin alertas ficticias</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Las alertas se mostrarán aquí cuando existan eventos reales registrados por el sistema.</p>
      </section>
    </div>
  );
}
