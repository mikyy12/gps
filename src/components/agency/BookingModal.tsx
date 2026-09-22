"use client";

import { X, Users, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type BookingTour = { id: string; boatName: string; routeName: string; price: number; availableSeats: number };

type BookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tour: BookingTour | null;
  agencyId: string;
  commissionRate: number;
  initialPassengers?: number;
};

function formatPercent(rate: number) {
  return new Intl.NumberFormat("es-EC", { style: "percent", maximumFractionDigits: 2 }).format(rate);
}

export function BookingModal({ isOpen, onClose, tour, agencyId, commissionRate, initialPassengers = 1 }: BookingModalProps) {
  const [passengers, setPassengers] = useState(() => Math.max(1, Math.min(tour?.availableSeats ?? 1, initialPassengers)));
  const [leadPassenger, setLeadPassenger] = useState("");
  const [document, setDocument] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ id: string; token: string; total: number; commission: number } | null>(null);
  const supabase = useMemo(() => createClient(), []);

  if (!isOpen || !tour) return null;
  const selectedTour = tour;
  const publicTotal = selectedTour.price * passengers;
  const estimatedCommission = publicTotal * commissionRate;
  const estimatedNet = publicTotal - estimatedCommission;

  async function confirmReservation() {
    setError("");
    if (!leadPassenger.trim() || leadPassenger.trim().length < 2) {
      setError("Ingresa el nombre completo del pasajero principal.");
      return;
    }
    if (!agencyId) {
      setError("Selecciona la agencia con la que realizarás la reserva.");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Tu sesión expiró. Inicia sesión nuevamente.");
      setLoading(false);
      return;
    }

    const { data, error: reservationError } = await supabase.rpc("create_reservation", {
      p_availability_id: selectedTour.id,
      p_agency_id: agencyId,
      p_passenger_count: passengers,
      p_lead_passenger_name: leadPassenger.trim(),
      p_lead_passenger_document: document.trim(),
    });

    if (reservationError) {
      const message = reservationError.message;
      if (message.includes("INSUFFICIENT_SEATS")) setError("Ya no hay suficientes cupos disponibles.");
      else if (message.includes("AGENCY_NOT_ALLOWED")) setError("Ya no tienes autorización para reservar con esta agencia.");
      else if (message.includes("AUTH_REQUIRED")) setError("Tu sesión expiró. Inicia sesión nuevamente.");
      else setError("No se pudo confirmar la reserva. Inténtalo nuevamente.");
      setLoading(false);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.reservation_id || !result?.voucher_token) {
      setError("La reserva fue procesada, pero no se recibió el voucher. Contacta al administrador.");
      setLoading(false);
      return;
    }

    setSuccess({
      id: result.reservation_id,
      token: result.voucher_token,
      total: Number(result.total_price ?? publicTotal),
      commission: Number(result.commission_amount ?? estimatedCommission),
    });
    setLoading(false);
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
    <div role="dialog" aria-modal="true" aria-labelledby="booking-modal-title" className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
        <div><h2 id="booking-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">Confirmar reserva</h2><p className="text-sm text-slate-500 mt-1">{selectedTour.boatName} · {selectedTour.routeName}</p></div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-6 overflow-y-auto space-y-6">
        {success ? <div className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Reserva confirmada</h3>
          <p className="text-slate-500 mt-2">Código: <span className="font-mono font-bold">{success.id}</span></p>
          <div className="mt-5 mx-auto max-w-sm p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-sm text-left space-y-2"><div className="flex justify-between"><span>Total</span><span className="font-bold">${success.total.toFixed(2)}</span></div><div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>Comisión</span><span className="font-bold">${success.commission.toFixed(2)}</span></div></div>
          <a href={`/verify/${encodeURIComponent(success.token)}`} target="_blank" rel="noreferrer" className="inline-flex mt-6 px-5 py-3 bg-primary text-white font-bold rounded-xl">Abrir voucher</a>
        </div> : <>
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700"><Users className="w-5 h-5 text-primary" /><div className="flex-1"><p className="font-bold">Pasajeros</p><p className="text-sm text-slate-500">Disponibles: {selectedTour.availableSeats}</p></div><div className="flex items-center gap-3"><button type="button" onClick={() => setPassengers(Math.max(1, passengers - 1))} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">−</button><span className="w-6 text-center font-bold">{passengers}</span><button type="button" onClick={() => setPassengers(Math.min(selectedTour.availableSeats, passengers + 1))} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">+</button></div></div>
          <div className="grid sm:grid-cols-2 gap-4"><input value={leadPassenger} onChange={e => setLeadPassenger(e.target.value)} placeholder="Nombre completo del titular" className="px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800" /><input value={document} onChange={e => setDocument(e.target.value)} placeholder="Pasaporte / Cédula" className="px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800" /></div>
          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/10 space-y-3"><div className="flex justify-between"><span>Precio público</span><span>${publicTotal.toFixed(2)}</span></div><div className="flex justify-between text-emerald-600"><span>Comisión ({formatPercent(commissionRate)})</span><span>- ${estimatedCommission.toFixed(2)}</span></div><div className="pt-3 border-t flex justify-between font-black"><span>Neto estimado</span><span className="text-2xl text-primary">${estimatedNet.toFixed(2)}</span></div></div>
          {error && <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
        </>}
      </div>
      {!success && <div className="p-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4"><button type="button" onClick={onClose} className="px-6 py-3.5 font-bold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancelar</button><button type="button" disabled={loading} onClick={confirmReservation} className="px-6 py-3.5 font-bold text-white bg-primary rounded-xl disabled:opacity-60 flex items-center justify-center gap-2">{loading && <Loader2 className="w-5 h-5 animate-spin" />}<CreditCard className="w-5 h-5" />Confirmar reserva</button></div>}
    </div>
  </div>;
}
