"use client";

import { useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function VesselFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [registration, setRegistration] = useState("");
  const [type, setType] = useState("ferry");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const parsedCapacity = Number(capacity);
    if (!name.trim() || !Number.isInteger(parsedCapacity) || parsedCapacity <= 0) { setError("Ingresa un nombre y una capacidad válida."); return; }
    setSaving(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("vessels").insert({ name: name.trim(), capacity: parsedCapacity, registration_number: registration.trim() || null, vessel_type: type || null });
    setSaving(false);
    if (insertError) { setError("No fue posible guardar la embarcación. Revisa los datos e inténtalo nuevamente."); return; }
    onClose();
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <form onSubmit={handleSubmit} role="dialog" aria-modal="true" aria-labelledby="vessel-modal-title" className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div><h2 id="vessel-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">Nueva Embarcación</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Registra únicamente datos operativos disponibles.</p></div>
          <button type="button" onClick={onClose} aria-label="Cerrar formulario de embarcación" className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-slate-600 active:scale-95 dark:hover:bg-slate-800 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5 overflow-y-auto p-6">
          <div className="space-y-1.5"><label htmlFor="vessel-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre de la embarcación</label><input id="vessel-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Galaxy I" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><label htmlFor="vessel-capacity" className="text-sm font-medium text-slate-700 dark:text-slate-300">Capacidad total</label><input id="vessel-capacity" required min="1" step="1" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="16" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></div>
            <div className="space-y-1.5"><label htmlFor="vessel-type" className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label><select id="vessel-type" value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="ferry">Ferry</option><option value="tour">Tour</option></select></div>
          </div>
          <div className="space-y-1.5"><label htmlFor="vessel-registration" className="text-sm font-medium text-slate-700 dark:text-slate-300">Matrícula <span className="font-normal text-slate-400">(opcional)</span></label><input id="vessel-registration" value={registration} onChange={(e) => setRegistration(e.target.value)} placeholder="Número de registro" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></div>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50"><button type="button" onClick={onClose} className="min-h-11 rounded-xl px-5 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-200 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button><button disabled={saving} type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all duration-300 hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Guardando…" : "Guardar Embarcación"}</button></div>
      </form>
    </div>
  );
}
