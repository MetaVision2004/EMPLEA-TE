"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { triggerEmail } from "@/lib/email";

type Oferta = {
  id: string;
  titulo: string;
  empresa: string;
  ciudad: string;
  modalidad: string;
  descripcion: string;
  salario_rango?: string;
};

export default function OfertasPage() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    const verificarYSincronizar = async () => {
      setLoading(true);
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({ id: currentUser.id, email: currentUser.email });

      const { data, error } = await supabase
        .from("ofertas")
        .select("*")
        .eq("activa", true)
        .order("created_at", { ascending: false });

      if (!error && data) setOfertas(data as Oferta[]);
      setLoading(false);
    };

    verificarYSincronizar();
  }, []);

  const postular = async (ofertaId: string) => {
    setMensaje(null);
    if (!user) {
      setMensaje("Debes iniciar sesión para postularte.");
      return;
    }

    const { error } = await supabase.from("postulaciones").insert({
      usuario_id: user.id,
      oferta_id: ofertaId,
      estado: "aplicado",
    });

    if (error) {
      if (error.code === "23505") {
        setMensaje("Ya te has postulado previamente a esta oferta.");
      } else {
        setMensaje("Error al postular: " + error.message);
      }
      return;
    }

    // Envía email de confirmación (no bloquea el flujo)
    const oferta = ofertas.find((o) => o.id === ofertaId);
    if (oferta) {
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("nombre")
        .eq("id", user.id)
        .single();

      triggerEmail.postulacion({
        name: perfil?.nombre ?? "Usuario",
        email: user.email ?? "",
        ofertaTitulo: oferta.titulo,
        ofertaEmpresa: oferta.empresa,
        ofertaCiudad: oferta.ciudad,
      });
    }

    setMensaje("¡Postulación enviada! Revisa 'Mis postulaciones'.");
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mb-2"></div>
        <p className="text-ink/60 text-sm">Verificando sesión...</p>
      </div>
    );
  }

  // GUARDA DE SEGURIDAD: Usuario no autenticado
  if (!user) {
    return (
      <div className="card max-w-md mx-auto text-center py-10 my-8 space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center mx-auto text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-display font-bold text-ink">
          Inicio de sesión requerido
        </h2>
        <p className="text-ink/70 text-sm">
          Debes iniciar sesión con tu cuenta de candidato para ver la lista de empleos y postularte a las vacantes.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/login" className="btn-primary">
            Ingresar a mi cuenta
          </Link>
          <Link href="/registro" className="btn-outline">
            Crear cuenta gratis
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
          <h1 className="text-2xl font-display font-bold text-ink">Ofertas disponibles</h1>
          <p className="text-ink/60 text-sm">Oportunidades seleccionadas para tu primer empleo.</p>
        </div>
      </div>

      {mensaje && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium mb-4 ${
            mensaje.includes("enviada")
              ? "bg-growth-50 text-growth-600 border-growth-500/20"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {mensaje}
        </div>
      )}

      {ofertas.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-ink/60">
            Aún no hay ofertas activas publicadas. Regresa más tarde.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {ofertas.map((oferta) => (
          <div key={oferta.id} className="card flex flex-col justify-between hover:border-primary-300 transition-colors">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h2 className="font-semibold text-lg text-ink">{oferta.titulo}</h2>
                <span className="badge bg-accent-50 text-accent-600 whitespace-nowrap capitalize">
                  {oferta.modalidad}
                </span>
              </div>
              <p className="text-sm text-ink/60 mb-2">
                <strong>{oferta.empresa}</strong> · {oferta.ciudad}
              </p>
              {oferta.salario_rango && (
                <p className="text-xs font-semibold text-primary-600 mb-2">
                  💰 {oferta.salario_rango}
                </p>
              )}
              <p className="text-sm text-ink/80 mb-4">{oferta.descripcion}</p>
            </div>
            <button className="btn-primary self-start text-xs" onClick={() => postular(oferta.id)}>
              Postularme
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
