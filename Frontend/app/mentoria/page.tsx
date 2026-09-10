"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Mentor = { id: string; nombre: string; especialidad: string; bio: string | null };
type Sesion = { id: string; fecha: string; tema: string; estado: string; mentores: { nombre: string } | null };

export default function MentoriaPage() {
  const [mentores, setMentores] = useState<Mentor[]>([]);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [mentorId, setMentorId] = useState("");
  const [fecha, setFecha] = useState("");
  const [tema, setTema] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      const [{ data: mentoresData }, { data: sesionesData }] = await Promise.all([
        supabase.from("mentores").select("id, nombre, especialidad, bio").eq("disponible", true).order("nombre"),
        user ? supabase.from("sesiones_mentoria").select("id, fecha, tema, estado, mentores ( nombre )").eq("usuario_id", user.id).order("fecha", { ascending: true }) : Promise.resolve({ data: [] }),
      ]);
      setMentores((mentoresData || []) as Mentor[]);
      setSesiones((sesionesData || []) as unknown as Sesion[]);
      setLoading(false);
    };
    cargar();
  }, []);

  const solicitar = async (event: FormEvent) => {
    event.preventDefault();
    setMensaje(null);
    if (!userId) return setMensaje("Inicia sesión para solicitar una mentoría.");
    if (!mentorId || !fecha || !tema.trim()) return setMensaje("Completa mentor, fecha y tema.");
    const { data, error } = await supabase.from("sesiones_mentoria").insert({ mentor_id: mentorId, usuario_id: userId, fecha: new Date(fecha).toISOString(), tema: tema.trim() }).select("id, fecha, tema, estado, mentores ( nombre )").single();
    if (error) return setMensaje(`No se pudo solicitar la sesión: ${error.message}`);
    setSesiones((prev) => [...prev, data as unknown as Sesion].sort((a, b) => a.fecha.localeCompare(b.fecha)));
    setFecha("");
    setTema("");
    setMensaje("Solicitud enviada. El mentor revisará tu agenda.");
  };

  if (loading) return <div className="card text-center py-12">Cargando mentoría...</div>;
  if (!userId) return <div className="card max-w-md mx-auto text-center py-10 space-y-3"><h1 className="text-xl font-display font-bold">Conecta con un mentor</h1><p className="text-sm text-ink/60">Inicia sesión para solicitar una sesión de orientación.</p><Link href="/login" className="btn-primary inline-block">Iniciar sesión</Link></div>;

  return (
    <div className="space-y-6">
      <div><span className="badge bg-growth-50 text-growth-700 mb-1">Acompañamiento</span><h1 className="text-3xl font-display font-bold text-ink">Mentoría</h1><p className="text-sm text-ink/60">Agenda una conversación con alguien que ya recorrió este camino.</p></div>
      {mensaje && <div className="rounded-xl border border-primary-100 bg-primary-50 p-3 text-sm text-primary-700">{mensaje}</div>}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-ink">Mentores disponibles</h2>
          {mentores.length === 0 ? <div className="card text-sm text-ink/60">Todavía no hay mentores disponibles.</div> : mentores.map((mentor) => <article key={mentor.id} className="card"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-ink">{mentor.nombre}</h3><p className="text-sm text-accent-600">{mentor.especialidad}</p></div><button onClick={() => setMentorId(mentor.id)} className="btn-outline text-xs">Elegir</button></div><p className="mt-2 text-sm text-ink/70">{mentor.bio || "Mentor voluntario de Emplea-TE."}</p></article>)}
        </section>
        <aside className="card h-fit"><h2 className="font-display text-xl font-bold text-ink mb-3">Solicitar sesión</h2><form onSubmit={solicitar} className="space-y-3"><label className="block text-sm font-medium text-ink/70">Mentor<select required value={mentorId} onChange={(event) => setMentorId(event.target.value)} className="input-field"><option value="">Selecciona un mentor</option>{mentores.map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.nombre} · {mentor.especialidad}</option>)}</select></label><label className="block text-sm font-medium text-ink/70">Fecha y hora<input required type="datetime-local" value={fecha} onChange={(event) => setFecha(event.target.value)} className="input-field" /></label><label className="block text-sm font-medium text-ink/70">Tema<textarea required minLength={5} maxLength={500} value={tema} onChange={(event) => setTema(event.target.value)} placeholder="Ej. Preparar entrevista" className="input-field min-h-24" /></label><button type="submit" className="btn-primary w-full">Solicitar mentoría</button></form></aside>
      </div>
      <section><h2 className="font-display text-xl font-bold text-ink mb-3">Mis sesiones</h2>{sesiones.length === 0 ? <p className="text-sm text-ink/60">Aún no tienes sesiones solicitadas.</p> : <div className="space-y-2">{sesiones.map((sesion) => <div key={sesion.id} className="card flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-ink">{sesion.tema}</p><p className="text-sm text-ink/60">{sesion.mentores?.nombre} · {new Date(sesion.fecha).toLocaleString("es-CO")}</p></div><span className="badge bg-accent-50 text-accent-700 capitalize">{sesion.estado}</span></div>)}</div>}</section>
    </div>
  );
}
