"use client";

import { useMemo, useState } from "react";
import { Ship, Mail, Key, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { resolvePostLoginPath } from "@/lib/auth/role-routing.mjs";

type AppRole = "admin" | "agency" | "operator";

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signInData.user) {
      setError("Correo o contraseña incorrectos. Verifica tus datos e inténtalo nuevamente.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", signInData.user.id)
      .maybeSingle();

    const roleName = (profile?.roles as { name?: string } | null)?.name;
    const role = roleName && ["admin", "agency", "operator"].includes(roleName) ? roleName as AppRole : null;

    if (profileError || !role) {
      await supabase.auth.signOut();
      setError("Tu cuenta todavía no tiene un rol operativo habilitado. Contacta al administrador.");
      setLoading(false);
      return;
    }

    const requestedNext = new URLSearchParams(window.location.search).get("next");
    window.location.assign(resolvePostLoginPath(role, requestedNext));
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0 z-0">
        <Image src="https://images.unsplash.com/photo-1549449830-4e3edce6c1a8?q=80&w=2072&auto=format&fit=crop" alt="Paisaje de las islas Galápagos" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" />
      </div>
      <section aria-labelledby="login-title" className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500 ease-out">
        <div className="rounded-[2rem] border border-white/20 bg-white/10 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10">
          <div className="mb-9 flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30 transition-transform duration-300 hover:scale-105"><Ship className="h-8 w-8 text-white" /></div>
            <h1 id="login-title" className="text-3xl font-black text-white">Bienvenido</h1>
            <p className="mt-2 text-slate-300">Plataforma de gestión y reservas</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2"><label htmlFor="login-email" className="ml-1 text-sm font-semibold text-slate-200">Correo electrónico</label><div className="relative"><Mail aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu-correo@ejemplo.com" className="w-full rounded-xl border border-white/20 bg-white/5 py-3.5 pl-11 pr-4 text-white outline-none transition-all focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-primary/70 placeholder:text-slate-500" /></div></div>
            <div className="space-y-2"><label htmlFor="login-password" className="ml-1 text-sm font-semibold text-slate-200">Contraseña</label><div className="relative"><Key aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input id="login-password" type="password" autoComplete="current-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-white/20 bg-white/5 py-3.5 pl-11 pr-4 text-white outline-none transition-all focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-primary/70 placeholder:text-slate-500" /></div></div>
            {error && <div role="alert" aria-live="polite" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>}
            <button type="submit" disabled={loading} className="group mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/30 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:bg-blue-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/80 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />}
              {loading ? "Iniciando sesión…" : "Iniciar sesión"}
            </button>
          </form>
        </div>
        <p className="mt-7 text-center text-xs text-slate-400">© 2026 Galapagos Booking System</p>
      </section>
    </main>
  );
}
