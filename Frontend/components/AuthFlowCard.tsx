"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Flow = "confirm" | "invite" | "magic" | "email" | "reauth";

const content: Record<Flow, { title: string; text: string; action: string }> = {
  confirm: { title: "Confirma tu cuenta", text: "Revisa tu correo y pulsa el enlace para activar tu cuenta de Emplea-TE.", action: "Volver a iniciar sesión" },
  invite: { title: "Acepta tu invitación", text: "Tu invitación está lista. Abre el enlace recibido para crear tu acceso a Emplea-TE.", action: "Ir a iniciar sesión" },
  magic: { title: "Enlace mágico", text: "Abre el enlace que enviamos a tu correo para entrar sin contraseña.", action: "Volver a iniciar sesión" },
  email: { title: "Cambiar correo electrónico", text: "Solicita el cambio y confirma el nuevo correo desde el enlace que recibirás.", action: "Volver a mi perfil" },
  reauth: { title: "Reautenticación", text: "Confirma tu identidad para continuar con una acción protegida de tu cuenta.", action: "Volver a mi perfil" },
};

export default function AuthFlowCard({ flow }: { flow: Flow }) {
  const [email, setEmail] = useState("");
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const item = content[flow];
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCompleted(["verified", "accepted", "authenticated", "updated"].some((key) => params.has(key)));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (flow === "email") {
      const { error: updateError } = await supabase.auth.updateUser(
        { email: email.trim() },
        { emailRedirectTo: `${window.location.origin}/auth/callback?type=email_change` }
      );
      if (updateError) setError(updateError.message);
      else setMessage("Te enviamos enlaces de confirmación al correo actual y al nuevo correo.");
    } else {
      const { error: reauthError } = await supabase.auth.reauthenticate();
      if (reauthError) setError(reauthError.message);
      else setMessage("Revisa tu correo para confirmar tu identidad.");
    }
    setLoading(false);
  };

  const requiresForm = flow === "email" || flow === "reauth";
  const href = flow === "email" || flow === "reauth" ? "/perfil" : "/login";

  return (
    <div className="card mx-auto my-10 max-w-md text-center">
      <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${completed ? "bg-growth-50 text-growth-600" : "bg-primary-50 text-primary-700"}`}>✓</div>
      <p className="eyebrow mb-3 justify-center">Emplea-TE</p>
      <h1 className="mb-3 text-2xl font-display font-bold text-ink">{item.title}</h1>
      <p className="mb-6 text-sm leading-6 text-ink/65">{completed ? "La operación se completó correctamente. Ya puedes continuar en Emplea-TE." : item.text}</p>

      {requiresForm && (
        <form onSubmit={submit} className="space-y-3 text-left">
          {flow === "email" && (
            <label className="block text-xs font-semibold text-ink/70">
              Nuevo correo electrónico
              <input className="input-field mt-1 mb-0" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} />
            </label>
          )}
          {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-xl border border-growth-500/30 bg-growth-50 p-3 text-sm text-growth-600">{message}</p>}
          {!message && <button className="btn-primary w-full" disabled={loading}>{loading ? "Procesando..." : flow === "email" ? "Enviar confirmación" : "Enviar verificación"}</button>}
        </form>
      )}

      {!requiresForm && !completed && <p className="mb-6 rounded-xl border border-primary-100 bg-primary-50 p-3 text-xs text-primary-700">Cuando pulses el enlace, volverás automáticamente a la aplicación.</p>}
      <Link href={href} className="btn-outline mt-5 w-full">{item.action}</Link>
    </div>
  );
}
