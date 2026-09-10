"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { isAdmin } from "@/lib/auth";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";

type Experiencia = {
  tipo: string;
  institucion: string | null;
  cargo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  descripcion: string | null;
};

const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", color: "#182235" },
  title: { fontSize: 24, marginBottom: 6 },
  contact: { fontSize: 10, color: "#526174", marginBottom: 18 },
  heading: { fontSize: 13, marginTop: 14, marginBottom: 6, color: "#0d6b78" },
  body: { fontSize: 10, lineHeight: 1.4 },
  item: { marginBottom: 8 },
});

function CvDocument({ nombre, ciudad, nivelEducativo, habilidades, experiencias }: {
  nombre: string;
  ciudad: string;
  nivelEducativo: string;
  habilidades: string;
  experiencias: Experiencia[];
}) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{nombre || "Mi perfil profesional"}</Text>
        <Text style={pdfStyles.contact}>{[ciudad, nivelEducativo].filter(Boolean).join(" · ")}</Text>
        <Text style={pdfStyles.heading}>Perfil</Text>
        <Text style={pdfStyles.body}>Habilidades: {habilidades || "Por completar"}</Text>
        <Text style={pdfStyles.heading}>Experiencia y formación</Text>
        {experiencias.length === 0 ? (
          <Text style={pdfStyles.body}>Aún no has agregado experiencias.</Text>
        ) : experiencias.map((experiencia, index) => (
          <View key={`${experiencia.institucion}-${index}`} style={pdfStyles.item}>
            <Text style={pdfStyles.body}>{experiencia.cargo || experiencia.tipo} · {experiencia.institucion || "Sin institución"}</Text>
            <Text style={pdfStyles.body}>{experiencia.fecha_inicio || ""} - {experiencia.fecha_fin || "Actualidad"}</Text>
            {experiencia.descripcion && <Text style={pdfStyles.body}>{experiencia.descripcion}</Text>}
          </View>
        ))}
      </Page>
    </Document>
  );
}

export default function PerfilPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [nivelEducativo, setNivelEducativo] = useState("");
  const [habilidades, setHabilidades] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? undefined);

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
      const { data: experienciasData } = await supabase
        .from("experiencias")
        .select("tipo, institucion, cargo, fecha_inicio, fecha_fin, descripcion")
        .eq("perfil_id", user.id)
        .order("fecha_inicio", { ascending: false });
      setExperiencias((experienciasData || []) as Experiencia[]);
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

  // GUARDA DE SEGURIDAD: Los administradores no acceden a esta sección
  if (isAdmin(userEmail)) {
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
        <PDFDownloadLink
          document={<CvDocument nombre={nombre} ciudad={ciudad} nivelEducativo={nivelEducativo} habilidades={habilidades} experiencias={experiencias} />}
          fileName="mi-cv-emplea-te.pdf"
          className="btn-outline w-full text-center mt-3"
        >
          {({ loading: pdfLoading }) => pdfLoading ? "Preparando CV..." : "Descargar CV en PDF"}
        </PDFDownloadLink>
      </form>
    </div>
  );
}
