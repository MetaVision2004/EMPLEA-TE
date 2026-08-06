/**
 * Llama a los endpoints de email del backend de Emplea-TE.
 * El backend corre en NEXT_PUBLIC_API_URL (default http://localhost:4000).
 *
 * Todos los errores se silencian — los emails son "best-effort" y no deben
 * bloquear el flujo principal de la app.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type WelcomePayload = {
  name: string;
  email: string;
};

type PostulacionPayload = {
  name: string;
  email: string;
  ofertaTitulo: string;
  ofertaEmpresa: string;
  ofertaCiudad?: string;
};

type EstadoPayload = {
  name: string;
  email: string;
  ofertaTitulo: string;
  ofertaEmpresa: string;
  nuevoEstado: "aplicado" | "entrevista" | "oferta" | "rechazado";
};

async function post(path: string, body: object) {
  try {
    await fetch(`${API}/api/email/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Email delivery is non-blocking — log and continue
    console.warn(`[email] No se pudo enviar email (${path})`);
  }
}

export const triggerEmail = {
  welcome: (payload: WelcomePayload) => post("welcome", payload),
  postulacion: (payload: PostulacionPayload) => post("postulacion", payload),
  estado: (payload: EstadoPayload) => post("estado", payload),
};
