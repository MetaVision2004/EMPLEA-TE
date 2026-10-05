/**
 * Llama a los endpoints de email del backend de Emplea-TE.
 * El backend corre en NEXT_PUBLIC_API_URL.
 *
 * El envío es no bloqueante; los fallos se registran para que no se reporten como éxito.
 */

const API = process.env.NEXT_PUBLIC_API_URL;
import { supabase } from "./supabaseClient";

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
  if (!API) {
    console.warn("[email] NEXT_PUBLIC_API_URL no está configurada");
    return;
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API}/api/email/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
