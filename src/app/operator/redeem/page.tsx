"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Search, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Voucher = {
  valid: boolean;
  reservation_id: string;
  voucher_id: string;
  lead_passenger_name: string;
  passenger_count: number;
  vessel_name: string | null;
  route_name: string | null;
  departure_date: string;
  departure_time: string;
  reservation_status: string;
  voucher_status: "issued" | "redeemed" | "revoked" | "expired";
  redeemed_at: string | null;
};

function tokenFromInput(value: string) {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.at(-1) || trimmed;
  } catch {
    return trimmed;
  }
}

export default function OperatorRedeemPage() {
  const supabase = useMemo(() => createClient(), []);
  const [token, setToken] = useState("");
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  async function verify(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setVoucher(null);
    const normalizedToken = tokenFromInput(token);
    setToken(normalizedToken);
    const { data, error: verifyError } = await supabase.rpc("verify_voucher", { p_token: normalizedToken });
    if (verifyError || !Array.isArray(data) || !data[0]) {
      setError("No se encontró un voucher con ese token.");
    } else {
      setVoucher(data[0] as Voucher);
    }
    setLoading(false);
  }

  async function redeem() {
    setRedeeming(true);
    setError("");
    setMessage("");
    const { data, error: redeemError } = await supabase.rpc("redeem_voucher", { p_token: tokenFromInput(token) });
    if (redeemError || !Array.isArray(data) || !data[0]) {
      setError(redeemError?.message.includes("OPERATOR_NOT_ALLOWED") ? "Este voucher no pertenece a una embarcación tuya." : "El voucher no puede redimirse. Puede haber sido usado o cancelado.");
    } else {
      setMessage("Voucher redimido correctamente.");
      setVoucher((current) => current ? { ...current, voucher_status: "redeemed", redeemed_at: data[0].redeemed_at, valid: true } : current);
    }
    setRedeeming(false);
  }

  const redeemable = voucher?.valid && voucher.voucher_status === "issued" && voucher.reservation_status !== "cancelled";

  return (
    <div className="p-4 space-y-5 pb-24">
      <header className="pt-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Control de acceso</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Redimir voucher</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Verifica el token y confirma el ingreso del pasajero.</p>
      </header>

      <form onSubmit={verify} className="space-y-3">
        <label htmlFor="voucher-token" className="text-sm font-bold text-slate-700 dark:text-slate-300">Token o contenido del QR</label>
        <input id="voucher-token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Pega el token del voucher" required className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
        <button type="submit" disabled={loading || !token.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />} Verificar
        </button>
      </form>

      {error && <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
      {message && <div role="status" className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 className="h-5 w-5 shrink-0" />{message}</div>}

      {voucher && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Estado</p><p className={`mt-1 text-xl font-black ${voucher.voucher_status === "issued" ? "text-emerald-600" : "text-amber-600"}`}>{voucher.voucher_status === "issued" ? "Listo para redimir" : voucher.voucher_status === "redeemed" ? "Ya redimido" : "No disponible"}</p></div><ShieldCheck className="h-8 w-8 text-blue-600" /></div>
        <div className="border-t border-slate-100 pt-4 dark:border-slate-800"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pasajero titular</p><p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{voucher.lead_passenger_name}</p><p className="text-sm text-slate-500">{voucher.passenger_count} pasajero(s) · {voucher.vessel_name || "Embarcación no registrada"}</p></div>
        {redeemable ? <button type="button" onClick={redeem} disabled={redeeming} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-50">{redeeming && <Loader2 className="h-5 w-5 animate-spin" />} Confirmar redención</button> : <p className="rounded-xl bg-slate-100 p-3 text-center text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">No se puede redimir nuevamente este voucher.</p>}
      </section>}
    </div>
  );
}