"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Calendar, MapPin, Users, Filter, Clock, Ship, CheckCircle2, Loader2, ArrowRight, Building2 } from "lucide-react";
import { BookingModal } from "@/components/agency/BookingModal";
import type { BookingTour } from "@/components/agency/BookingModal";
import { createClient } from "@/lib/supabase/client";

type AvailabilityRow = {
  id: string;
  date: string;
  departure_time: string;
  total_seats: number;
  available_seats: number;
  status: string;
  vessel_name: string | null;
  route_name: string | null;
  origin: string | null;
  destination: string | null;
  duration_minutes: number | null;
  tour_name: string | null;
  tour_description: string | null;
  base_price: number | null;
};

type AgencyContext = { id: string; name: string; commissionRate: number };
type AgencyMembershipRow = {
  agency_id: string;
  agency: { id: string; name: string; commission_rate: number } | null;
};

function toIsoDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return "";
  return `${year}-${month}-${day}`;
}
function formatDate(value: string) { return new Intl.DateTimeFormat("es-EC", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function formatDuration(minutes?: number | null) { if (!minutes) return "Duración no especificada"; const days = Math.floor(minutes / 1440); const hours = Math.floor((minutes % 1440) / 60); if (days) return `${days} día${days > 1 ? "s" : ""}${hours ? ` / ${hours} h` : ""}`; return `${hours} h`; }
function formatPercent(rate: number) { return new Intl.NumberFormat("es-EC", { style: "percent", maximumFractionDigits: 2 }).format(rate); }

export default function AgencySearchPage() {
  const [rows, setRows] = useState<AvailabilityRow[]>([]);
  const [selectedTour, setSelectedTour] = useState<BookingTour | null>(null);
  const [dateSearch, setDateSearch] = useState("");
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState(2);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [agencies, setAgencies] = useState<AgencyContext[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
  const [agencyLoading, setAgencyLoading] = useState(true);
  const [agencyError, setAgencyError] = useState("");
  const supabase = useMemo(() => createClient(), []);

  const selectedAgency = agencies.find(agency => agency.id === selectedAgencyId) ?? null;

  useEffect(() => {
    let mounted = true;
    async function loadAgencyContext() {
      setAgencyLoading(true);
      setAgencyError("");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!mounted) return;
      if (userError || !user) {
        setAgencyError("No se pudo validar tu sesión de agencia.");
        setAgencyLoading(false);
        return;
      }

      const { data, error: membershipError } = await supabase
        .from("agencies_users")
        .select("agency_id,agency:agencies(id,name,commission_rate)")
        .eq("user_id", user.id);

      if (!mounted) return;
      if (membershipError) {
        setAgencyError("No se pudo cargar la agencia asociada a tu usuario.");
        setAgencyLoading(false);
        return;
      }

      const memberships = (data ?? []) as unknown as AgencyMembershipRow[];
      const nextAgencies = memberships.flatMap(row => row.agency ? [{
        id: row.agency.id,
        name: row.agency.name,
        commissionRate: Number(row.agency.commission_rate ?? 0),
      }] : []);
      setAgencies(nextAgencies);
      setSelectedAgencyId(current => current && nextAgencies.some(agency => agency.id === current) ? current : nextAgencies[0]?.id ?? "");
      if (nextAgencies.length === 0) setAgencyError("Tu usuario no está vinculado a una agencia habilitada.");
      setAgencyLoading(false);
    }

    loadAgencyContext();
    return () => { mounted = false; };
  }, [supabase]);

  async function searchAvailability() {
    setLoading(true);
    setError("");
    setSearched(true);
    const isoDate = toIsoDate(dateSearch);
    if (dateSearch && !isoDate) {
      setError("La fecha no es válida. Usa DD/MM/AAAA.");
      setRows([]);
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase.rpc("search_availability", {
      p_date: isoDate || null,
      p_query: destination.trim() || null,
      p_passengers: passengers,
    });

    if (queryError) {
      setError("No se pudo consultar la disponibilidad. Revisa la conexión con Supabase.");
      setRows([]);
    } else {
      setRows((data ?? []) as unknown as AvailabilityRow[]);
    }
    setLoading(false);
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => { let value = e.target.value.replace(/\D/g, "").slice(0, 8); if (value.length >= 2 && Number(value.slice(0, 2)) > 31) value = "31" + value.slice(2); if (value.length >= 4 && Number(value.slice(2, 4)) > 12) value = value.slice(0, 2) + "12" + value.slice(4); if (value.length > 4) value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`; else if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`; setDateSearch(value); };
  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.value) { const [year, month, day] = e.target.value.split("-"); setDateSearch(`${day}/${month}/${year}`); } };

  return <div className="w-full">
    <div className="relative pt-16 pb-32 flex flex-col items-center justify-center text-center px-4 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white,_transparent_35%)]" />
      <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative z-10 w-full max-w-5xl space-y-6">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-blue-100 text-xs font-bold uppercase tracking-wider border border-white/10 shadow-lg shadow-black/10"><Ship className="w-4 h-4" /> Disponibilidad en vivo</span>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">Encuentra la ruta perfecta.</h1>
        <p className="text-base sm:text-lg text-slate-200 font-medium">Consulta cupos reales antes de reservar.</p>
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-2xl ring-1 ring-white/10 flex flex-col md:flex-row items-center gap-3 w-full">
          <div className="flex-1 w-full flex items-center px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/30"><MapPin className="w-5 h-5 text-primary mr-3 shrink-0" /><input value={destination} onChange={e => setDestination(e.target.value)} aria-label="Destino" placeholder="Destino, origen o ruta" className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white font-medium placeholder:text-slate-500" /></div>
          <div className="w-full md:w-52 flex items-center px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl relative transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/30"><input type="date" aria-label="Abrir calendario" className="absolute left-0 top-0 w-12 h-full opacity-0 cursor-pointer z-10" onChange={handleNativeDateChange} /><Calendar className="w-5 h-5 text-primary mr-3 shrink-0" /><input type="text" aria-label="Fecha de salida" value={dateSearch} onChange={handleDateChange} placeholder="DD/MM/AAAA" className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white font-medium placeholder:text-slate-500" /></div>
          <div className="w-full md:w-40 flex items-center px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/30"><Users className="w-5 h-5 text-primary mr-3 shrink-0" /><input type="number" aria-label="Número de pasajeros" value={passengers} onChange={e => setPassengers(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} min="1" max="100" className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white font-medium" /></div>
          <button type="button" onClick={searchAvailability} disabled={loading} className="w-full md:w-auto min-h-14 px-8 py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-2xl transition-all duration-300 ease-in-out shadow-lg shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />} Buscar</button>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-20">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] bg-white/95 dark:bg-slate-900/95 backdrop-blur p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="font-medium text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-900 dark:text-white">{rows.length}</span> salidas disponibles</p>
          <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2 min-w-0 text-sm"><Building2 className="w-4 h-4 text-primary shrink-0" />{agencyLoading ? <span className="text-slate-500">Cargando agencia…</span> : agencies.length > 1 ? <select aria-label="Agencia para reservar" value={selectedAgencyId} onChange={event => { setSelectedAgencyId(event.target.value); setSelectedTour(null); }} className="min-h-10 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white">{agencies.map(agency => <option key={agency.id} value={agency.id}>{agency.name} · {formatPercent(agency.commissionRate)}</option>)}</select> : selectedAgency ? <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{selectedAgency.name} · comisión {formatPercent(selectedAgency.commissionRate)}</span> : <span className="text-red-600 dark:text-red-400">Sin agencia habilitada</span>}</div>
        </div>
        <button type="button" onClick={searchAvailability} disabled={loading} className="min-h-11 flex items-center justify-center gap-2 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-60"><Filter className="w-4 h-4" /> Actualizar</button>
      </div>
      {agencyError && <div role="alert" className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50">{agencyError}</div>}
      {error && <div role="alert" className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50">{error}</div>}
      {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" /><p className="mt-3 text-slate-500 dark:text-slate-400">Consultando disponibilidad…</p></div> : searched && rows.length === 0 ? <div className="py-20 px-6 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"><Ship className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" /><p className="mt-4 font-bold text-slate-900 dark:text-white">No hay salidas con esos criterios.</p><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Prueba otra fecha, ruta, destino o cantidad de pasajeros.</p></div> : <div className="space-y-5">{rows.map(row => { const tourName = row.tour_name || row.route_name || "Salida"; const seats = row.available_seats || 0; const price = Number(row.base_price || 0); const canBook = !!selectedAgency && !!price && seats >= passengers; return <div key={row.id} className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-2xl hover:-translate-y-1 border border-slate-200/70 dark:border-slate-800/70 transition-all duration-300 ease-out">
        <div className="relative w-full md:w-64 h-48 md:h-auto min-h-48 bg-gradient-to-br from-blue-700 via-cyan-700 to-slate-900 flex items-center justify-center"><Ship className="w-24 h-24 text-white/15 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3" /><span className="absolute top-4 left-4 px-3 py-1.5 bg-white/95 dark:bg-slate-900/90 rounded-lg text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 shadow-sm"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Disponible</span></div>
        <div className="flex-1 p-6 flex flex-col"><div className="flex items-center gap-2 text-primary font-bold text-sm mb-2 uppercase tracking-wide"><Ship className="w-4 h-4" />{row.vessel_name || "Embarcación"}</div><h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{tourName}</h3><p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{row.origin || "Origen"} → {row.destination || "Destino"}</p><div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium"><span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatDuration(row.duration_minutes)}</span><span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" /><span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(row.date)} · {row.departure_time?.slice(0,5)}</span></div><div className="mt-auto pt-5"><span className="inline-flex px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-sm font-bold border border-emerald-100 dark:border-emerald-900/50">{seats} cupo{seats === 1 ? "" : "s"} libre{seats === 1 ? "" : "s"}</span></div></div>
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col justify-center items-center md:items-end text-center md:text-right border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800"><p className="text-sm text-slate-500 dark:text-slate-400">Precio por persona</p><p className="text-3xl font-black text-slate-900 dark:text-white my-2">{price ? `$${price.toFixed(2)}` : "Consultar"}</p><p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-6">{selectedAgency ? `Comisión: ${formatPercent(selectedAgency.commissionRate)}` : "Selecciona una agencia"}</p><button type="button" disabled={!canBook} onClick={() => setSelectedTour({ id: row.id, boatName: row.vessel_name || "Embarcación", routeName: tourName, price, availableSeats: seats })} className="group/btn w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2">{!selectedAgency ? "Selecciona una agencia" : seats < passengers ? "Cupos insuficientes" : <>Reservar / Bloquear <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" /></>}</button></div>
      </div>; })}</div>}
    </div>
    {selectedTour && selectedAgency && <BookingModal key={`${selectedTour.id}:${selectedAgency.id}`} isOpen onClose={() => setSelectedTour(null)} tour={selectedTour} agencyId={selectedAgency.id} commissionRate={selectedAgency.commissionRate} initialPassengers={passengers} />}
  </div>;
}
