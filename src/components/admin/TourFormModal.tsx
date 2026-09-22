"use client";

import { Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CreatedTour = { id: string; name: string; description: string | null; base_price: number | null };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (tour: CreatedTour) => void;
};

export function TourFormModal({ isOpen, onClose, onCreated }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function resetAndClose() {
    if (saving) return;
    setName("");
    setPrice("");
    setDescription("");
    setError("");
    onClose();
  }

  async function createTour(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedName = name.trim();
    const numericPrice = Number(price);
    if (normalizedName.length < 2) {
      setError("Ingresa un nombre de tour válido.");
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError("El precio base debe ser un número mayor o igual a cero.");
      return;
    }

    setSaving(true);
    const { data, error: insertError } = await supabase
      .from("tours")
      .insert({
        name: normalizedName,
        description: description.trim() || null,
        base_price: numericPrice,
      })
      .select("id,name,description,base_price")
      .single();

    if (insertError || !data) {
      setError("No se pudo crear el tour. Verifica los datos y tu sesión de administrador.");
      setSaving(false);
      return;
    }

    onCreated(data as CreatedTour);
    setSaving(false);
    setName("");
    setPrice("");
    setDescription("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={resetAndClose} />
      <form onSubmit={createTour} role="dialog" aria-modal="true" aria-labelledby="tour-modal-title" className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div><h2 id="tour-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">Nuevo Tour</h2><p className="mt-1 text-sm text-slate-500">Crea un servicio comercial. La ruta y la disponibilidad de cada salida se gestionan por separado.</p></div>
          <button type="button" onClick={resetAndClose} disabled={saving} aria-label="Cerrar formulario de tour" className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 ease-in-out active:scale-95 disabled:opacity-50"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><label htmlFor="tour-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Tour</label><input id="tour-name" type="text" required minLength={2} value={name} onChange={event => setName(event.target.value)} placeholder="Ej. San Cristóbal 360" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" /></div>
            <div className="space-y-1.5"><label htmlFor="tour-price" className="text-sm font-medium text-slate-700 dark:text-slate-300">Precio Base ($)</label><input id="tour-price" type="number" min="0" step="0.01" required value={price} onChange={event => setPrice(event.target.value)} placeholder="150.00" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" /></div>
          </div>
          <div className="space-y-1.5"><label htmlFor="tour-description" className="text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label><textarea id="tour-description" rows={4} value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe los puntos principales del tour..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none" /></div>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button type="button" onClick={resetAndClose} disabled={saving} className="min-h-11 px-5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 ease-in-out active:scale-95 disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={saving} className="min-h-11 px-5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-xl transition-all duration-300 ease-in-out active:scale-95 shadow-md shadow-primary/20 disabled:opacity-60 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Crear Tour</button>
        </div>
      </form>
    </div>
  );
}
