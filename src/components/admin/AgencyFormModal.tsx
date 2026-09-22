"use client";

import { Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CreatedAgency = {
  id: string;
  name: string;
  ruc: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  commission_rate: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (agency: CreatedAgency) => void;
};

export function AgencyFormModal({ isOpen, onClose, onCreated }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState("");
  const [ruc, setRuc] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("15");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function resetAndClose() {
    if (saving) return;
    setName("");
    setRuc("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCommissionPercent("15");
    setError("");
    onClose();
  }

  async function createAgency(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedName = name.trim();
    const commission = Number(commissionPercent);
    if (normalizedName.length < 2) {
      setError("Ingresa un nombre de agencia válido.");
      return;
    }
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      setError("La comisión debe estar entre 0% y 100%.");
      return;
    }

    setSaving(true);
    const { data, error: insertError } = await supabase
      .from("agencies")
      .insert({
        name: normalizedName,
        ruc: ruc.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        commission_rate: commission / 100,
      })
      .select("id,name,ruc,email,phone,address,commission_rate")
      .single();

    if (insertError || !data) {
      setError(insertError?.message?.includes("agencies_ruc_key") ? "Ya existe una agencia con ese RUC." : "No se pudo crear la agencia. Verifica los datos y tu sesión de administrador.");
      setSaving(false);
      return;
    }

    onCreated(data as CreatedAgency);
    setSaving(false);
    setName("");
    setRuc("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCommissionPercent("15");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={resetAndClose} />
      <form onSubmit={createAgency} role="dialog" aria-modal="true" aria-labelledby="agency-modal-title" className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div><h2 id="agency-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">Nueva Agencia Aliada</h2><p className="mt-1 text-sm text-slate-500">Crea el registro comercial. Los accesos de usuarios se aprovisionan por separado.</p></div>
          <button type="button" onClick={resetAndClose} disabled={saving} aria-label="Cerrar formulario de agencia" className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 ease-in-out active:scale-95 disabled:opacity-50"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="space-y-1.5"><label htmlFor="agency-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre de la Agencia</label><input id="agency-name" type="text" required minLength={2} value={name} onChange={event => setName(event.target.value)} placeholder="Ej. Galápagos Dreams" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><label htmlFor="agency-ruc" className="text-sm font-medium text-slate-700 dark:text-slate-300">RUC / Identificación fiscal</label><input id="agency-ruc" type="text" value={ruc} onChange={event => setRuc(event.target.value)} placeholder="Opcional" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" /></div>
            <div className="space-y-1.5"><label htmlFor="agency-commission" className="text-sm font-medium text-slate-700 dark:text-slate-300">Comisión (%)</label><input id="agency-commission" type="number" min="0" max="100" step="0.01" required value={commissionPercent} onChange={event => setCommissionPercent(event.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><label htmlFor="agency-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo de contacto</label><input id="agency-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="contacto@agencia.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" /></div>
            <div className="space-y-1.5"><label htmlFor="agency-phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono / WhatsApp</label><input id="agency-phone" type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+593 9..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" /></div>
          </div>
          <div className="space-y-1.5"><label htmlFor="agency-address" className="text-sm font-medium text-slate-700 dark:text-slate-300">Dirección</label><input id="agency-address" type="text" value={address} onChange={event => setAddress(event.target.value)} placeholder="Opcional" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" /></div>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button type="button" onClick={resetAndClose} disabled={saving} className="min-h-11 px-5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 ease-in-out active:scale-95 disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={saving} className="min-h-11 px-5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-xl transition-all duration-300 ease-in-out active:scale-95 shadow-md shadow-primary/20 disabled:opacity-60 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Crear Agencia</button>
        </div>
      </form>
    </div>
  );
}
