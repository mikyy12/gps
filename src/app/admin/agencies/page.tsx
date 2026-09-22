"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Mail, MessageCircle, Loader2, AlertCircle, Inbox, Building2, BadgePercent } from "lucide-react";
import { AgencyFormModal } from "@/components/admin/AgencyFormModal";
import type { CreatedAgency } from "@/components/admin/AgencyFormModal";
import { createClient } from "@/lib/supabase/client";

type Agency = CreatedAgency;

function formatPercent(rate: number) {
  return new Intl.NumberFormat("es-EC", { style: "percent", maximumFractionDigits: 2 }).format(rate);
}

export default function AgenciesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadAgencies() {
      setLoading(true);
      const { data, error: queryError } = await supabase.from("agencies").select("id,name,ruc,email,phone,address,commission_rate").order("name", { ascending: true });
      if (!mounted) return;
      if (queryError) setError("No fue posible cargar las agencias. Intenta nuevamente.");
      else setAgencies((data ?? []) as Agency[]);
      setLoading(false);
    }
    loadAgencies();
    return () => { mounted = false; };
  }, [supabase]);

  function handleCreated(agency: CreatedAgency) {
    setAgencies(current => [...current, agency].sort((a, b) => a.name.localeCompare(b.name, "es")));
    setError("");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-primary">B2B</span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Directorio de Agencias</h1>
          <p className="text-slate-500 dark:text-slate-400">Consulta y registra agencias con su comisión comercial.</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all duration-300 ease-in-out shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950">
          <Plus className="w-5 h-5" /> Nueva Agencia
        </button>
      </div>

      {error && <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /><p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Cargando agencias…</p></div>
      ) : agencies.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/50"><Inbox className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" /><h2 className="mt-4 font-bold text-slate-900 dark:text-white">No hay agencias registradas</h2><p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">Crea la primera agencia desde “Nueva Agencia”.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {agencies.map((agency) => (
            <article key={agency.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-primary/5">
              <div className="border-b border-slate-100 bg-gradient-to-br from-white to-slate-50 p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800/50">
                <div className="flex items-start justify-between gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-primary dark:bg-blue-900/20"><Building2 className="h-6 w-6" /></div><span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><BadgePercent className="h-3.5 w-3.5" />{formatPercent(Number(agency.commission_rate ?? 0))}</span></div>
                <h2 className="mt-4 truncate text-xl font-bold text-slate-900 dark:text-white">{agency.name}</h2>
                {agency.ruc && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">RUC: {agency.ruc}</p>}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                {agency.email ? <a href={`mailto:${agency.email}`} className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800"><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{agency.email}</span></a> : <p className="text-sm text-slate-400">Sin correo registrado</p>}
                {agency.phone ? <a href={`tel:${agency.phone}`} className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800"><MessageCircle className="h-4 w-4 shrink-0" /><span>{agency.phone}</span></a> : <p className="text-sm text-slate-400">Sin teléfono registrado</p>}
                {agency.address && <p className="mt-auto border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">{agency.address}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      <AgencyFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handleCreated} />
    </div>
  );
}
