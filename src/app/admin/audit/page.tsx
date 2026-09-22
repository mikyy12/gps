"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, History, CheckCircle2, XCircle, AlertCircle, RefreshCw, Loader2, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AuditLog = { id: string; action: string; table_name: string | null; record_id: string | null; old_value: unknown; new_value: unknown; created_at: string; user_id: string | null };

function getTypeStyles(action: string) {
  const value = action.toLowerCase();
  if (value.includes("cancel") || value.includes("delete") || value.includes("error")) return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: <XCircle className="w-5 h-5" /> };
  if (value.includes("confirm") || value.includes("create") || value.includes("emit")) return { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle2 className="w-5 h-5" /> };
  if (value.includes("block") || value.includes("warn")) return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", icon: <AlertCircle className="w-5 h-5" /> };
  return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: <RefreshCw className="w-5 h-5" /> };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function valueSummary(value: unknown) {
  if (value == null) return "Sin detalle adicional.";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return "Detalle no disponible."; }
}

export default function AuditLogPage() {
  const supabase = useMemo(() => createClient(), []);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadLogs() {
      setLoading(true);
      const { data, error: queryError } = await supabase.from("audit_logs").select("id,action,table_name,record_id,old_value,new_value,created_at,user_id").order("created_at", { ascending: false }).limit(100);
      if (!mounted) return;
      if (queryError) setError("No fue posible cargar el historial de auditoría. Verifica tu sesión de administrador.");
      else setLogs((data ?? []) as AuditLog[]);
      setLoading(false);
    }
    loadLogs();
    return () => { mounted = false; };
  }, [supabase]);

  const filteredLogs = logs.filter((log) => {
    const haystack = [log.action, log.table_name, log.record_id, valueSummary(log.old_value), valueSummary(log.new_value)].join(" ").toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <span className="text-xs font-black uppercase tracking-widest text-primary">Seguridad</span>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white"><History className="h-8 w-8 text-primary" />Historial de Auditoría</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Consulta las acciones registradas por el sistema.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-primary/40 dark:border-slate-700 dark:bg-slate-950">
          <Search className="mr-2 h-5 w-5 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} type="search" aria-label="Buscar en el historial de auditoría" placeholder="Buscar por acción, tabla o registro…" className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white" />
        </div>
      </div>

      {error && <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /><p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Cargando historial…</p></div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/50"><Inbox className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" /><h2 className="mt-4 font-bold text-slate-900 dark:text-white">{search ? "No hay coincidencias" : "No hay eventos registrados"}</h2><p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{search ? "Prueba con otro término de búsqueda." : "Las acciones aparecerán aquí cuando el sistema genere registros de auditoría."}</p></div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left" aria-label="Registro de acciones del sistema">
              <thead><tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"><th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Acción</th><th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Detalle</th><th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Registro</th><th className="p-4 text-right text-xs font-bold uppercase tracking-widest text-slate-500">Fecha</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => { const styles = getTypeStyles(log.action); const detail = valueSummary(log.new_value !== null ? log.new_value : log.old_value); return <tr key={log.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="p-4"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.bg} ${styles.text}`}>{styles.icon}</div><div><p className="font-bold text-slate-900 dark:text-white">{log.action}</p>{log.table_name && <p className="text-xs text-slate-400">{log.table_name}</p>}</div></div></td><td className="max-w-xl p-4 text-sm text-slate-600 dark:text-slate-300"><span className="line-clamp-2">{detail}</span></td><td className="p-4 text-xs font-medium text-slate-500 dark:text-slate-400">{log.record_id || "—"}</td><td className="whitespace-nowrap p-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400">{formatDate(log.created_at)}</td></tr>; })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
