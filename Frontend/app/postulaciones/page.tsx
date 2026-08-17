"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { triggerEmail } from "@/lib/email";
import { isAdmin } from "@/lib/auth";

type Postulacion = {
  id: string;
  estado: string;
  ofertas: { titulo: string; empresa: string } | null;
};

const ESTADOS = ["aplicado", "entrevista", "oferta", "rechazado"] as const;
type Estado = (typeof ESTADOS)[number];

const ESTADO_LABELS: Record<Estado, string> = {
  aplicado:   "Aplicado",
  entrevista: "Entrevista",
  oferta:     "Oferta",
  rechazado:  "Rechazado",
};

const ESTADO_COLORS: Record<Estado, string> = {
  aplicado:   "bg-indigo-50 border-indigo-200 text-indigo-700",
  entrevista: "bg-sky-50 border-sky-200 text-sky-700",
  oferta:     "bg-emerald-50 border-emerald-200 text-emerald-700",
  rechazado:  "bg-red-50 border-red-200 text-red-700",
};

export default function PostulacionesPage() {
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; nombre: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Load profile name for email
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("nombre")
        .eq("id", user.id)
        .single();

      setCurrentUser({
        id: user.id,
        email: user.email ?? "",
        nombre: perfil?.nombre ?? "Usuario",
      });

      const { data } = await supabase
        .from("postulaciones")
        .select("id, estado, ofertas ( titulo, empresa )")
        .eq("usuario_id", user.id);

      if (data) setPostulaciones(data as unknown as Postulacion[]);
      setLoading(false);
    };
    cargar();
  }, []);

  const cambiarEstado = async (postulacion: Postulacion, nuevoEstado: Estado) => {
    if (postulacion.estado === nuevoEstado) return;
    setUpdatingId(postulacion.id);

    const { error } = await supabase
      .from("postulaciones")
      .update({ estado: nuevoEstado })
      .eq("id", postulacion.id);

    if (!error) {
      setPostulaciones((prev) =>
        prev.map((p) => (p.id === postulacion.id ? { ...p, estado: nuevoEstado } : p))
      );

      // Send status-change email (non-blocking)
      if (currentUser && postulacion.ofertas) {
        triggerEmail.estado({
          name: currentUser.nombre,
          email: currentUser.email,
          ofertaTitulo: postulacion.ofertas.titulo,
          ofertaEmpresa: postulacion.ofertas.empresa,
          nuevoEstado,
        });
      }
    }

    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mb-2"></div>
        <p className="text-ink/60 text-sm">Cargando tus postulaciones...</p>
      </div>
    );
  }

  // GUARDA DE SEGURIDAD: Usuario no autenticado
  if (!currentUser) {
    return (
      <div className="card max-w-md mx-auto text-center py-10 my-8 space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center mx-auto text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-display font-bold text-ink">
          Inicio de sesión requerido
        </h2>
        <p className="text-ink/70 text-sm">
          Debes iniciar sesión para hacer el seguimiento a tus postulaciones.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/login" className="btn-primary">
            Ingresar a mi cuenta
          </Link>
          <Link href="/registro" className="btn-outline">
            Crear cuenta
          </Link>
        </div>
      </div>
    );
  }

  // GUARDA DE SEGURIDAD: Los administradores no acceden a esta sección
  if (isAdmin(currentUser.email)) {
    return (
      <div className="card max-w-md mx-auto text-center py-10 my-8 space-y-4">
        <div className="w-12 h-12 rounded-full bg-accent-50 text-accent-500 flex items-center justify-center mx-auto text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-display font-bold text-ink">
          Sección exclusiva para candidatos
        </h2>
        <p className="text-ink/70 text-sm">
          Como administrador, tu espacio de trabajo es el Panel de Administración. Esta sección es solo para usuarios candidatos.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/admin/ofertas" className="btn-primary bg-accent-500 hover:bg-accent-600">
            Ir al Panel Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <span className="badge bg-primary-50 text-primary-600 mb-1">
            🌐 Modo Público (Candidato)
          </span>
          <h1 className="text-2xl font-display font-bold text-ink">Mis postulaciones</h1>
          <p className="text-ink/60 text-sm">Sigue el estado de cada proceso, de aplicado a contratado.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {ESTADOS.map((estado) => {
          const postulacionesEnEstado = postulaciones.filter((p) => p.estado === estado);
          return (
            <div key={estado} className="bg-white rounded-2xl shadow-soft p-3.5 border border-primary-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-primary-50 pb-2">
                  <h3 className="font-semibold capitalize text-sm text-primary-600">
                    {ESTADO_LABELS[estado]}
                  </h3>
                  <span className="badge bg-primary-50 text-primary-700 font-bold">
                    {postulacionesEnEstado.length}
                  </span>
                </div>

                {postulacionesEnEstado.length === 0 ? (
                  <p className="text-xs text-ink/40 text-center py-4 italic">Sin postulaciones</p>
                ) : (
                  postulacionesEnEstado.map((p) => (
                    <div key={p.id} className="border border-primary-100 rounded-xl p-3 mb-2 text-sm bg-paper/40 space-y-1">
                      <p className="font-semibold text-ink leading-tight">{p.ofertas?.titulo}</p>
                      <p className="text-xs text-ink/60 mb-2">{p.ofertas?.empresa}</p>

                      {/* Selector de cambio de estado */}
                      <select
                        disabled={updatingId === p.id}
                        value={p.estado}
                        onChange={(e) => cambiarEstado(p, e.target.value as Estado)}
                        className={`w-full text-xs rounded-lg border px-2 py-1 cursor-pointer font-medium focus:outline-none ${ESTADO_COLORS[p.estado as Estado]}`}
                        title="Cambiar estado de postulación"
                      >
                        {ESTADOS.map((s) => (
                          <option key={s} value={s}>
                            {ESTADO_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      {updatingId === p.id && (
                        <p className="text-xs text-ink/40 mt-1 animate-pulse">Guardando cambio...</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
