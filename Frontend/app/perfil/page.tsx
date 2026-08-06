"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PerfilPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [nivelEducativo, setNivelEducativo] = useState("");
  const [habilidades, setHabilidades] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (perfil) {
        setNombre(perfil.nombre || "");
        setCiudad(perfil.ciudad || "");
        setNivelEducativo(perfil.nivel_educativo || "");
        setHabilidades((perfil.habilidades || []).join(", "));
      }
      setLoading(false);
    };
    cargarPerfil();
  }, []);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setMensaje(null);

    const { error } = await supabase.from("perfiles").upsert({
      id: userId,
      nombre,
      ciudad,
      nivel_educativo: nivelEducativo,
      habilidades: habilidades.split(",").map((h) => h.trim()).filter(Boolean),
    });

    if (error) {
      setMensaje("Error al guardar: " + error.message);
      return;
    }

    if (cvFile) {
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(`${userId}/cv.pdf`, cvFile, { upsert: true });

      if (uploadError) {
        setMensaje("Perfil guardado, pero falló la subida del CV: " + uploadError.message);
        return;
      }
    }

    setMensaje("Perfil guardado correctamente ✅");
  };

  if (loading) return <p>Cargando...</p>;

  if (!userId) {
    return (
      <div className="card">
        <p>Debes iniciar sesión para ver tu perfil.</p>
        <a href="/login" className="text-primary-500 underline font-medium">Ir a login</a>
      </div>
    );
  }

  return (
    <div className="card max-w-lg mx-auto">
      <h1 className="text-2xl font-display font-bold mb-1">Mi perfil</h1>
      <p className="text-ink/60 text-sm mb-5">Así te verán las empresas que publican ofertas.</p>
      <form onSubmit={handleGuardar}>
        <label className="text-sm text-ink/70 font-medium">Nombre completo</label>
        <input
          className="input-field"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <label className="text-sm text-ink/70 font-medium">Ciudad</label>
        <input
          className="input-field"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
        />

        <label className="text-sm text-ink/70 font-medium">Nivel educativo</label>
        <input
          className="input-field"
          value={nivelEducativo}
          onChange={(e) => setNivelEducativo(e.target.value)}
          placeholder="Ej: Bachiller, Técnico, Universitario"
        />

        <label className="text-sm text-ink/70 font-medium">Habilidades (separadas por coma)</label>
        <input
          className="input-field"
          value={habilidades}
          onChange={(e) => setHabilidades(e.target.value)}
          placeholder="Ej: Excel, Atención al cliente, Inglés básico"
        />

        <label className="text-sm text-ink/70 font-medium">Subir CV (PDF)</label>
        <input
          type="file"
          accept="application/pdf"
          className="mb-4"
          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
        />

        {mensaje && <p className="text-sm mb-3">{mensaje}</p>}

        <button type="submit" className="btn-primary w-full">
          Guardar perfil
        </button>
      </form>
    </div>
  );
}
