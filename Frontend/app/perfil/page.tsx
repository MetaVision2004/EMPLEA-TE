"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { isAdmin } from "@/lib/auth";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";

type Experiencia = {
  id?: string;
  tipo: string;
  institucion: string | null;
  cargo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  descripcion: string | null;
};

type ExperienciaDraft = Omit<Experiencia, "id">;

const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", color: "#182235" },
  title: { fontSize: 24, marginBottom: 6 },
  contact: { fontSize: 10, color: "#526174", marginBottom: 18 },
  heading: { fontSize: 13, marginTop: 14, marginBottom: 6, color: "#0d6b78" },
  body: { fontSize: 10, lineHeight: 1.4 },
  item: { marginBottom: 8 },
});

function CvDocument({ nombre, ciudad, nivelEducativo, habilidades, bio, telefono, email, linkedin, portfolio, experiencias }: {
  nombre: string;
  ciudad: string;
  nivelEducativo: string;
  habilidades: string;
  bio: string;
  telefono: string;
  email: string;
  linkedin: string;
  portfolio: string;
  experiencias: Experiencia[];
}) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{nombre || "Mi perfil profesional"}</Text>
        <Text style={pdfStyles.contact}>{[email, telefono, ciudad, nivelEducativo, linkedin, portfolio].filter(Boolean).join(" · ")}</Text>
        {bio && <><Text style={pdfStyles.heading}>Perfil profesional</Text><Text style={pdfStyles.body}>{bio}</Text></>}
        <Text style={pdfStyles.heading}>Habilidades</Text>
        <Text style={pdfStyles.body}>{habilidades || "Por completar"}</Text>
        <Text style={pdfStyles.heading}>Formación y experiencia</Text>
        {experiencias.length === 0 ? <Text style={pdfStyles.body}>Aún no has agregado experiencias.</Text> : experiencias.map((experiencia, index) => (
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
  const [bio, setBio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);
  const [nuevaExperiencia, setNuevaExperiencia] = useState<ExperienciaDraft>({
    tipo: "laboral", institucion: "", cargo: "", fecha_inicio: "", fecha_fin: "", descripcion: "",
  });

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
        setUserRole(perfil.rol);
        setNombre(perfil.nombre || "");
        setCiudad(perfil.ciudad || "");
        setNivelEducativo(perfil.nivel_educativo || "");
        setHabilidades((perfil.habilidades || []).join(", "));
        setBio(perfil.bio || "");
        setTelefono(perfil.telefono || "");
        setLinkedin(perfil.linkedin_url || "");
        setPortfolio(perfil.portfolio_url || "");
      }
      const { data: experienciasData } = await supabase
        .from("experiencias")
        .select("id, tipo, institucion, cargo, fecha_inicio, fecha_fin, descripcion")
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
      bio,
      telefono,
      linkedin_url: linkedin,
      portfolio_url: portfolio,
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

  const agregarExperiencia = async () => {
    if (!userId || !nuevaExperiencia.institucion || !nuevaExperiencia.cargo) return;
    const { data, error } = await supabase.from("experiencias").insert({ perfil_id: userId, ...nuevaExperiencia }).select("id, tipo, institucion, cargo, fecha_inicio, fecha_fin, descripcion").single();
    if (error) { setMensaje("Error al agregar experiencia: " + error.message); return; }
    setExperiencias((actuales) => [data as Experiencia, ...actuales]);
    setNuevaExperiencia({ tipo: "laboral", institucion: "", cargo: "", fecha_inicio: "", fecha_fin: "", descripcion: "" });
    setMensaje("Experiencia agregada. Guarda el perfil para actualizar el CV.");
  };

  const eliminarExperiencia = async (id?: string) => {
    if (!id) return;
    const { error } = await supabase.from("experiencias").delete().eq("id", id);
    if (error) { setMensaje("Error al eliminar experiencia: " + error.message); return; }
    setExperiencias((actuales) => actuales.filter((experiencia) => experiencia.id !== id));
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
  if (isAdmin(userEmail, userRole)) {
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

        <label className="text-sm text-ink/70 font-medium">Resumen profesional</label>
        <textarea className="input-field min-h-24" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cuenta brevemente quién eres, qué buscas y qué puedes aportar." />

        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-sm text-ink/70 font-medium">Teléfono</label><input className="input-field" value={telefono} onChange={(e) => setTelefono(e.target.value)} /></div>
          <div><label className="text-sm text-ink/70 font-medium">Correo para contacto</label><input className="input-field" value={userEmail || ""} readOnly /></div>
        </div>

        <label className="text-sm text-ink/70 font-medium">Nivel educativo</label>
        <input
          className="input-field"
          value={nivelEducativo}
          onChange={(e) => setNivelEducativo(e.target.value)}
          placeholder="Ej: Bachiller, Técnico, Universitario"
        />

        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-sm text-ink/70 font-medium">LinkedIn</label><input className="input-field" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
          <div><label className="text-sm text-ink/70 font-medium">Portafolio</label><input className="input-field" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://..." /></div>
        </div>

        <section className="mt-6 border-t border-ink/10 pt-5">
          <h2 className="font-display font-bold text-lg">Formación y experiencia</h2>
          <p className="text-sm text-ink/60 mb-3">Agrega estudios, empleos, prácticas o voluntariados para enriquecer tu CV.</p>
          {experiencias.map((experiencia) => <div key={experiencia.id} className="border border-ink/10 rounded-lg p-3 mb-3">
            <p className="font-medium">{experiencia.cargo || experiencia.tipo} · {experiencia.institucion}</p>
            <p className="text-sm text-ink/60">{experiencia.fecha_inicio || ""} - {experiencia.fecha_fin || "Actualidad"}</p>
            {experiencia.descripcion && <p className="text-sm mt-1">{experiencia.descripcion}</p>}
            <button type="button" className="text-sm text-red-700 mt-2" onClick={() => eliminarExperiencia(experiencia.id)}>Eliminar</button>
          </div>)}
          <div className="grid sm:grid-cols-2 gap-3">
            <select className="input-field" value={nuevaExperiencia.tipo} onChange={(e) => setNuevaExperiencia({ ...nuevaExperiencia, tipo: e.target.value })}>
              <option value="laboral">Experiencia laboral</option><option value="educacion">Formación</option><option value="voluntariado">Voluntariado</option>
            </select>
            <input className="input-field" placeholder="Institución o empresa" value={nuevaExperiencia.institucion || ""} onChange={(e) => setNuevaExperiencia({ ...nuevaExperiencia, institucion: e.target.value })} />
            <input className="input-field" placeholder="Cargo, programa o rol" value={nuevaExperiencia.cargo || ""} onChange={(e) => setNuevaExperiencia({ ...nuevaExperiencia, cargo: e.target.value })} />
            <input className="input-field" placeholder="Fecha de inicio" type="date" value={nuevaExperiencia.fecha_inicio || ""} onChange={(e) => setNuevaExperiencia({ ...nuevaExperiencia, fecha_inicio: e.target.value })} />
            <input className="input-field" placeholder="Fecha de finalización" type="date" value={nuevaExperiencia.fecha_fin || ""} onChange={(e) => setNuevaExperiencia({ ...nuevaExperiencia, fecha_fin: e.target.value })} />
          </div>
          <textarea className="input-field min-h-20" placeholder="Describe logros, responsabilidades o lo aprendido" value={nuevaExperiencia.descripcion || ""} onChange={(e) => setNuevaExperiencia({ ...nuevaExperiencia, descripcion: e.target.value })} />
          <button type="button" className="btn-outline w-full" onClick={agregarExperiencia}>Agregar entrada</button>
        </section>

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
          document={<CvDocument nombre={nombre} ciudad={ciudad} nivelEducativo={nivelEducativo} habilidades={habilidades} bio={bio} telefono={telefono} email={userEmail || ""} linkedin={linkedin} portfolio={portfolio} experiencias={experiencias} />}
          fileName="mi-cv-emplea-te.pdf"
          className="btn-outline w-full text-center mt-3"
        >
          {({ loading: pdfLoading }) => pdfLoading ? "Preparando CV..." : "Descargar CV en PDF"}
        </PDFDownloadLink>
      </form>
    </div>
  );
}
