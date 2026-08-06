"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { triggerEmail } from "@/lib/email";

type Oferta = {
  id: string;
  titulo: string;
  empresa: string;
  ciudad: string;
  modalidad: string;
  descripcion: string;
};

export default function OfertasPage() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const cargarOfertas = async () => {
      const { data, error } = await supabase
        .from("ofertas")
        .select("*")
        .eq("activa", true)
        .order("created_at", { ascending: false });

      if (!error && data) setOfertas(data as Oferta[]);
    };
    cargarOfertas();
  }, []);

  const postular = async (ofertaId: string) => {
    setMensaje(null);
    const { data: { user } } = await supabase.auth.getUser();

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
      setMensaje("Error al postular: " + error.message);
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

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Ofertas disponibles</h1>
      <p className="text-ink/60 mb-6">Oportunidades pensadas para tu primer empleo.</p>

      {mensaje && (
        <p className="badge bg-primary-50 text-primary-500 mb-4">{mensaje}</p>
      )}

      {ofertas.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-ink/60">
            Aún no hay ofertas cargadas. (Agrega filas en la tabla{" "}
            <code className="bg-primary-50 px-1.5 py-0.5 rounded">ofertas</code>{" "}
            desde Supabase.)
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {ofertas.map((oferta) => (
          <div key={oferta.id} className="card flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h2 className="font-semibold text-lg">{oferta.titulo}</h2>
              <span className="badge bg-accent-50 text-accent-600 whitespace-nowrap">
                {oferta.modalidad}
              </span>
            </div>
            <p className="text-sm text-ink/60 mb-2">
              {oferta.empresa} · {oferta.ciudad}
            </p>
            <p className="text-sm text-ink/80 mb-4 flex-1">{oferta.descripcion}</p>
            <button className="btn-primary self-start" onClick={() => postular(oferta.id)}>
              Postularme
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
