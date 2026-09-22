"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, ShieldCheck, Users, Calendar, Ship, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VoucherQr } from "@/components/voucher/VoucherQr";

type Voucher = { valid: boolean; reservation_id: string; voucher_id: string; lead_passenger_name: string; passenger_count: number; vessel_name: string | null; route_name: string | null; departure_date: string; departure_time: string; reservation_status: string; voucher_status: "issued" | "redeemed" | "revoked" | "expired"; redeemed_at: string | null; agency_name: string | null; issued_at: string };

export default function VerifyVoucherPage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [error, setError] = useState("");
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function verify() {
      const token = Array.isArray(params.id) ? params.id[0] : params.id;
      const { data, error: rpcError } = await supabase.rpc("verify_voucher", { p_token: token });
      if (rpcError) setError("No fue posible verificar el voucher.");
      else setVoucher((Array.isArray(data) ? data[0] : data) as Voucher | null);
      setLoading(false);
    }
    verify();
  }, [params.id, supabase]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><div className="text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-400" /><p className="mt-4 font-bold">Verificando voucher...</p></div></div>;

  const valid = !!voucher && voucher.valid && voucher.reservation_status !== "cancelled";
  const redeemed = voucher?.voucher_status === "redeemed";
  const statusLabel = redeemed ? "Redimido" : valid ? "Válido" : "No válido";

  return <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
    <div className={`w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border ${valid ? "border-emerald-200" : "border-red-200"}`}>
      <div className={`${valid ? redeemed ? "bg-amber-500" : "bg-emerald-500" : "bg-red-500"} p-8 text-center text-white`}>
        {valid ? <CheckCircle className="w-20 h-20 mx-auto mb-3" /> : <XCircle className="w-20 h-20 mx-auto mb-3" />}
        <h1 className="text-3xl font-black uppercase">{statusLabel}</h1>
        <p className="mt-1 uppercase tracking-widest text-sm">{valid ? redeemed ? "Este voucher ya fue redimido" : "Reserva confirmada" : error || "Voucher inexistente o cancelado"}</p>
      </div>
      {valid && voucher && <div className="p-6 space-y-5">
        <div className="text-center border-b pb-5"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pasajero titular</p><h2 className="text-2xl font-black">{voucher.lead_passenger_name}</h2><p className="text-slate-500">{voucher.passenger_count} pasajero(s)</p></div>
        <div className="grid grid-cols-2 gap-4"><div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800"><Ship className="w-5 h-5 mb-2 text-blue-500" /><p className="text-xs text-slate-500">Embarcación</p><p className="font-bold">{voucher.vessel_name || "No registrada"}</p></div><div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800"><Users className="w-5 h-5 mb-2 text-blue-500" /><p className="text-xs text-slate-500">Ruta</p><p className="font-bold">{voucher.route_name || "No registrada"}</p></div></div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800"><Calendar className="w-5 h-5 mb-2 text-blue-500" /><p className="text-xs text-slate-500">Salida</p><p className="font-bold">{voucher.departure_date} · {voucher.departure_time.slice(0,5)}</p></div>
        <div className="text-center pt-2"><p className="text-xs text-slate-500">Agencia emisora</p><p className="font-bold">{voucher.agency_name || "Sistema"}</p></div>
        <VoucherQr token={Array.isArray(params.id) ? params.id[0] : params.id} />
      </div>}
    </div>
    <div className="mt-6 flex items-center gap-2 text-slate-500 text-xs uppercase tracking-widest"><ShieldCheck className="w-4 h-4" /> Verificación mediante token seguro</div>
  </div>;
}
