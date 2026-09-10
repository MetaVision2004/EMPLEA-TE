"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Recurso = {
  id: string;
  titulo: string;
  tipo: "articulo" | "video" | "curso";
  url: string | null;
  categoria: string | null;
  nivel: string | null;
};

const typeStyles = {
  articulo: "bg-primary-50 text-primary-700",
  video: "bg-accent-50 text-accent-700",
  curso: "bg-growth-50 text-growth-700",
};

export default function RecursosPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [completados, setCompletados] = useState<Set<string>>(new Set());
  const [categoria, setCategoria] = useState("todas");
  const [nivel, setNivel] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      const [{ data: recursosData }, { data: progresoData }] = await Promise.all([
        supabase.from("recursos").select("*").order("titulo"),
        user ? supabase.from("recursos_completados").select("recurso_id").eq("usuario_id", user.id) : Promise.resolve({ data: [] }),
      ]);
      setRecursos((recursosData || []) as Recurso[]);
      setCompletados(new Set((progresoData || []).map((item: { recurso_id: string }) => item.recurso_id)));
      setLoading(false);
    };
    cargar();
  }, []);

  const toggleCompletado = async (recursoId: string) => {
    if (!userId) return;
    const estaCompletado = completados.has(recursoId);
    const next = new Set(completados);
    if (estaCompletado) {
      await supabase.from("recursos_completados").delete().match({ usuario_id: userId, recurso_id: recursoId });
      next.delete(recursoId);
    } else {
      await supabase.from("recursos_completados").insert({ usuario_id: userId, recurso_id: recursoId });
      next.add(recursoId);
    }
    setCompletados(next);
  };

  const filtrados = useMemo(() => recursos.filter((recurso) =>
    (categoria === "todas" || recurso.categoria === categoria) &&
    (nivel === "todos" || recurso.nivel === nivel)
  ), [recursos, categoria, nivel]);

  const categorias = Array.from(new Set(recursos.map((recurso) => recurso.categoria).filter(Boolean))) as string[];
  const niveles = Array.from(new Set(recursos.map((recurso) => recurso.nivel).filter(Boolean))) as string[];

  if (loading) return <div className="card text-center py-12">Cargando recursos...</div>;

  return (
    <div className="space-y-5">
      <div>
        <span className="badge bg-accent-50 text-accent-700 mb-1">Aprendizaje</span>
        <h1 className="text-3xl font-display font-bold text-ink">Recursos para avanzar</h1>
        <p className="text-ink/60 text-sm">Materiales seleccionados para fortalecer tu búsqueda laboral.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <select aria-label="Filtrar por categoría" value={categoria} onChange={(event) => setCategoria(event.target.value)} className="input-field mb-0 max-w-xs">
          <option value="todas">Todas las categorías</option>
          {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select aria-label="Filtrar por nivel" value={nivel} onChange={(event) => setNivel(event.target.value)} className="input-field mb-0 max-w-xs">
          <option value="todos">Todos los niveles</option>
          {niveles.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      {filtrados.length === 0 ? (
        <div className="card text-center py-10 text-ink/60">No hay recursos con estos filtros.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((recurso) => {
            const completado = completados.has(recurso.id);
            return (
              <article key={recurso.id} className="card flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`badge capitalize ${typeStyles[recurso.tipo]}`}>{recurso.tipo}</span>
                  {completado && <span className="text-xs font-semibold text-growth-600">Completado</span>}
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-ink">{recurso.titulo}</h2>
                  <p className="text-sm text-ink/60 mt-1">{recurso.categoria || "General"} · {recurso.nivel || "Todos los niveles"}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3">
                  {recurso.url ? <a href={recurso.url} target="_blank" rel="noreferrer" className="btn-primary text-xs">Abrir recurso</a> : <span />}
                  {userId ? (
                    <button onClick={() => toggleCompletado(recurso.id)} className="btn-outline text-xs">
                      {completado ? "Desmarcar" : "Marcar completado"}
                    </button>
                  ) : <Link href="/login" className="text-xs text-primary-600 underline">Inicia sesión para guardar</Link>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
