"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Ship, Users, Loader2, AlertCircle, Inbox } from "lucide-react";
import { VesselFormModal } from "@/components/admin/VesselFormModal";
import { createClient } from "@/lib/supabase/client";

type Vessel = {
  id: string;
  name: string;
  capacity: number;
  registration_number: string | null;
  vessel_type: string | null;
};

export default function VesselsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadVessels() {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from("vessels")
        .select("id,name,capacity,registration_number,vessel_type")
        .order("name", { ascending: true });

      if (!mounted) return;
      if (queryError) setError("No fue posible cargar la flota. Intenta nuevamente.");
      else setVessels((data ?? []) as Vessel[]);
      setLoading(false);
    }
    loadVessels();
    return () => { mounted = false; };
  }, [supabase]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-primary">Operaciones</span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Embarcaciones</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestiona la flota registrada en el sistema.</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all duration-300 ease-in-out shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950">
          <Plus className="w-5 h-5" /> Nueva Embarcación
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Cargando embarcaciones…</p>
        </div>
      ) : vessels.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <Inbox className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-4 font-bold text-slate-900 dark:text-white">No hay embarcaciones registradas</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">La flota aparecerá aquí cuando se registre una embarcación.</p>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {vessels.map((vessel) => (
            <article key={vessel.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-primary/5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-12 sm:items-center">
                <div className="sm:col-span-6 md:col-span-5 flex items-center gap-4 min-w-0">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    <Ship className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">{vessel.name}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{vessel.vessel_type || "Tipo no especificado"}</p>
                    {vessel.registration_number && <p className="truncate text-xs text-slate-400 dark:text-slate-500">Matrícula: {vessel.registration_number}</p>}
                  </div>
                </div>
                <div className="sm:col-span-3 md:col-span-4 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:border-l sm:border-t-0 sm:pt-0 sm:pl-5">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary"><Users className="h-5 w-5" /></div>
                  <div><div className="text-lg font-bold leading-none text-slate-900 dark:text-white">{vessel.capacity}</div><div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">pasajeros máx.</div></div>
                </div>
                <div className="sm:col-span-3 md:col-span-3 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800 sm:border-t-0 sm:pt-0">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Registrada</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <VesselFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
