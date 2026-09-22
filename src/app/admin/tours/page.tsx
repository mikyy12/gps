"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, DollarSign, Loader2, AlertCircle, Inbox, Map, ArrowRight } from "lucide-react";
import { TourFormModal } from "@/components/admin/TourFormModal";
import type { CreatedTour } from "@/components/admin/TourFormModal";
import { createClient } from "@/lib/supabase/client";

type Tour = CreatedTour;

export default function ToursPage() {
  const supabase = useMemo(() => createClient(), []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadTours() {
      setLoading(true);
      const { data, error: queryError } = await supabase.from("tours").select("id,name,description,base_price").order("name", { ascending: true });
      if (!mounted) return;
      if (queryError) setError("No fue posible cargar el catálogo de tours. Intenta nuevamente.");
      else setTours((data ?? []) as Tour[]);
      setLoading(false);
    }
    loadTours();
    return () => { mounted = false; };
  }, [supabase]);

  function handleCreated(tour: CreatedTour) {
    setTours(current => [...current, tour].sort((a, b) => a.name.localeCompare(b.name, "es")));
    setError("");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-primary">Catálogo</span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Tours</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestiona los servicios turísticos y sus precios base.</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all duration-300 ease-in-out shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950"><Plus className="w-5 h-5" />Nuevo Tour</button>
      </div>

      {error && <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /><p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Cargando catálogo…</p></div>
      ) : tours.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/50"><Inbox className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" /><h2 className="mt-4 font-bold text-slate-900 dark:text-white">No hay tours registrados</h2><p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">Crea el primer servicio desde “Nuevo Tour” para comenzar a construir el catálogo.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {tours.map((tour) => (
            <article key={tour.id} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-primary/5">
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/10 via-slate-50 to-slate-100 dark:from-primary/10 dark:via-slate-900 dark:to-slate-800"><Map className="h-14 w-14 text-primary/50 transition-transform duration-500 group-hover:scale-110" /></div>
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tour.name}</h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{tour.description || "Sin descripción registrada."}</p>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"><DollarSign className="h-4 w-4 text-emerald-500" /> Precio base</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{tour.base_price != null ? `$${Number(tour.base_price).toFixed(2)}` : "Sin precio"}</span>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 dark:bg-slate-800/70 dark:text-slate-400"><ArrowRight className="h-3.5 w-3.5 text-primary" />Rutas y disponibilidad se gestionan por salida.</div>
              </div>
            </article>
          ))}
        </div>
      )}

      <TourFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handleCreated} />
    </div>
  );
}
