"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { triggerEmail } from "@/lib/email";

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

  if (loading) return <p className="text-gray-500 p-4">Cargando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Mis postulaciones</h1>
      <p className="text-ink/60 text-sm mb-6">Sigue el estado de cada proceso, de aplicado a contratado.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ESTADOS.map((estado) => (
          <div key={estado} className="bg-white rounded-2xl shadow-soft p-3 border border-primary-50">
            <h3 className="font-semibold capitalize mb-2 text-sm text-primary-500">
              {ESTADO_LABELS[estado]}
            </h3>
            {postulaciones
              .filter((p) => p.estado === estado)
              .map((p) => (
                <div key={p.id} className="border rounded-lg p-2 mb-2 text-sm">
                  <p className="font-medium">{p.ofertas?.titulo}</p>
                  <p className="text-gray-500 mb-2">{p.ofertas?.empresa}</p>

                  {/* Status changer */}
                  <select
                    disabled={updatingId === p.id}
                    value={p.estado}
                    onChange={(e) => cambiarEstado(p, e.target.value as Estado)}
                    className={`w-full text-xs rounded-md border px-2 py-1 cursor-pointer font-medium focus:outline-none ${ESTADO_COLORS[p.estado as Estado]}`}
                    title="Cambiar estado"
                  >
                    {ESTADOS.map((s) => (
                      <option key={s} value={s}>
                        {ESTADO_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  {updatingId === p.id && (
                    <p className="text-xs text-gray-400 mt-1">Guardando...</p>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
