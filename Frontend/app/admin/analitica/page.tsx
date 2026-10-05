"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Stats = { perfiles: { total: number; completos: number }; postulaciones: { entrevista: number } };

export default function AnaliticaPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle()
        : { data: null };
      const hasAccess = Boolean(user && ["admin", "staff"].includes(profile?.rol || ""));
      setAllowed(hasAccess);
      if (!hasAccess) return;
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) return setError(error.message || "No se pudo cargar la analítica.");
      setStats(data as Stats);
    };
    cargar().catch(() => setError("No se pudo cargar la analítica."));
  }, []);

  if (allowed === null) return <div className="card text-center py-12">Cargando analítica...</div>;
  if (!allowed) return <div className="card max-w-md mx-auto text-center py-10 space-y-3"><h1 className="text-xl font-display font-bold">Acceso restringido</h1><p className="text-sm text-ink/60">Esta vista está disponible para staff y empresas.</p><Link href="/ofertas" className="btn-primary inline-block">Volver a ofertas</Link></div>;
  if (error) return <div className="card text-center py-10 text-red-600">{error}</div>;
  if (!stats) return <div className="card text-center py-12">Consultando datos...</div>;

  return <div className="space-y-6"><div><span className="badge bg-accent-50 text-accent-700 mb-1">Panel privado</span><h1 className="text-3xl font-display font-bold text-ink">Analítica básica</h1><p className="text-sm text-ink/60">Una lectura rápida del estado de la comunidad.</p></div><div className="grid gap-4 sm:grid-cols-3"><div className="card"><p className="text-xs uppercase tracking-wider text-ink/50">Perfiles registrados</p><p className="mt-2 text-4xl font-display font-bold text-ink">{stats.perfiles.total}</p></div><div className="card"><p className="text-xs uppercase tracking-wider text-growth-600">Perfiles completos</p><p className="mt-2 text-4xl font-display font-bold text-growth-600">{stats.perfiles.completos}</p><p className="text-xs text-ink/50 mt-1">Con nombre, ciudad, educación y habilidades</p></div><div className="card"><p className="text-xs uppercase tracking-wider text-primary-600">Postulaciones en entrevista</p><p className="mt-2 text-4xl font-display font-bold text-primary-600">{stats.postulaciones.entrevista}</p></div></div></div>;
}
