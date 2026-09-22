import { Users, Ship, Ticket, TrendingUp, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [reservations, agencies, vessels, departures] = await Promise.all([
    supabase.from("reservations").select("id,status,total_price,commission_amount,passenger_count,availability:availability(date,departure_time,vessel:vessels(name),route:routes(name))"),
    supabase.from("agencies").select("id", { count: "exact", head: true }),
    supabase.from("vessels").select("id", { count: "exact", head: true }),
    supabase.from("availability").select("id,date,departure_time,total_seats,available_seats,status,vessel:vessels(name),route:routes(name)").gte("date", today).eq("status", "active").order("date", { ascending: true }).order("departure_time", { ascending: true }).limit(6),
  ]);

  const reservationRows = (reservations.data ?? []) as Array<{ id:string; status:string; total_price:number|null; commission_amount:number|null; passenger_count:number; availability?: { date?:string; departure_time?:string; vessel?:{name?:string}|null; route?:{name?:string}|null }|null }>;
  const confirmed = reservationRows.filter(r => r.status !== "cancelled");
  const revenue = confirmed.reduce((sum, r) => sum + Number(r.total_price || 0), 0);
  const commission = confirmed.reduce((sum, r) => sum + Number(r.commission_amount || 0), 0);
  const metricError = reservations.error || agencies.error || vessels.error || departures.error;

  const stats = [
    { title: "Reservas vigentes", value: String(confirmed.length), icon: Ticket, detail: `${reservationRows.length - confirmed.length} canceladas`, tone: "text-blue-600 bg-blue-100" },
    { title: "Ventas acumuladas", value: `$${revenue.toFixed(2)}`, icon: TrendingUp, detail: `Comisión: $${commission.toFixed(2)}`, tone: "text-emerald-600 bg-emerald-100" },
    { title: "Agencias", value: String(agencies.count ?? 0), icon: Users, detail: "registradas en la plataforma", tone: "text-purple-600 bg-purple-100" },
    { title: "Embarcaciones", value: String(vessels.count ?? 0), icon: Ship, detail: "registradas en la plataforma", tone: "text-orange-600 bg-orange-100" },
  ];

  return <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div><h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1><p className="text-slate-500 dark:text-slate-400">Datos operativos reales de Galápagos System.</p></div>
    {metricError && <div className="p-4 rounded-2xl bg-amber-50 text-amber-800 border border-amber-100">Algunas métricas no pudieron cargarse. Revisa la conexión de Supabase.</div>}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{stats.map(stat => <div key={stat.title} className="glass p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800"><div className="flex justify-between items-start mb-5"><div className={`p-3 rounded-xl ${stat.tone}`}><stat.icon className="w-6 h-6" /></div></div><h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.title}</h3><p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p><p className="text-xs text-slate-500 mt-2">{stat.detail}</p></div>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass p-6 rounded-2xl"><div className="flex items-center justify-between mb-5"><div><h3 className="font-semibold text-lg text-slate-900 dark:text-white">Próximas salidas</h3><p className="text-sm text-slate-500">Disponibilidad registrada desde hoy.</p></div><CalendarDays className="w-5 h-5 text-slate-400" /></div>{departures.data?.length ? <div className="space-y-3">{(departures.data as Array<{id:string;date:string;departure_time:string;total_seats:number;available_seats:number;vessel?:{name?:string}|null;route?:{name?:string}|null}>).map(dep => <div key={dep.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800"><div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex flex-col items-center justify-center font-bold"><span className="text-xs">{dep.date.slice(8,10)}</span><span className="text-[10px]">{dep.date.slice(5,7)}</span></div><div className="flex-1 min-w-0"><p className="font-semibold truncate">{dep.route?.name || "Ruta"}</p><p className="text-xs text-slate-500">{dep.vessel?.name || "Embarcación"} · {dep.departure_time.slice(0,5)}</p></div><span className={`text-sm font-bold ${dep.available_seats === 0 ? "text-red-600" : "text-emerald-600"}`}>{dep.available_seats}/{dep.total_seats} libres</span></div>)}</div> : <div className="py-14 text-center text-slate-500">No hay salidas próximas registradas.</div>}</div>
      <div className="glass p-6 rounded-2xl"><h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-5">Últimas reservas</h3>{reservationRows.length ? <div className="space-y-3">{reservationRows.slice(0,6).map(res => <div key={res.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800"><div className="flex justify-between gap-3"><span className="font-mono text-xs truncate">{res.id}</span><span className={`text-xs font-bold ${res.status === "cancelled" ? "text-red-600" : "text-emerald-600"}`}>{res.status === "cancelled" ? "Cancelada" : "Confirmada"}</span></div><p className="text-sm font-semibold mt-1">{res.availability?.route?.name || "Ruta"}</p><p className="text-xs text-slate-500">{res.passenger_count} pasajero(s) · ${Number(res.total_price || 0).toFixed(2)}</p></div>)}</div> : <div className="py-14 text-center text-slate-500">No hay reservas todavía.</div>}</div>
    </div>
  </div>;
}
