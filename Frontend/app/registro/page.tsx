"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { triggerEmail } from "@/lib/email";

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exitoInfo, setExitoInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const translateError = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes("user already registered") || lower.includes("already exists")) {
      return "Ya existe una cuenta registrada con este correo electrónico. Intenta iniciar sesión.";
    }
    if (lower.includes("password should be at least")) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    if (lower.includes("unable to validate email")) {
      return "Formato de correo electrónico no válido.";
    }
    return msg;
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExitoInfo(null);

    if (!nombre.trim()) {
      setError("Por favor ingresa tu nombre completo.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { nombre: nombre.trim() },
      },
    });

    if (signUpError) {
      setError(translateError(signUpError.message));
      setLoading(false);
      return;
    }

    // Intenta crear/actualizar el perfil extendido si hay usuario
    if (data.user) {
      const { error: perfilError } = await supabase.from("perfiles").upsert(
        {
          id: data.user.id,
          nombre: nombre.trim(),
        },
        { onConflict: "id" }
      );

      if (perfilError && !perfilError.message.includes("row-level security")) {
        console.warn("[registro] Aviso perfil:", perfilError.message);
      }

      // Envía email de bienvenida (no bloquea el flujo)
      triggerEmail.welcome({ name: nombre.trim(), email: email.trim() });
    }

    setLoading(false);

    // Si Supabase devolvió sesión, el auto-login funcionó inmediatamente
    if (data.session) {
      router.push("/perfil");
    } else {
      // Si requiere confirmación de email por configuración de Supabase:
      setExitoInfo(
        "¡Cuenta creada con éxito! Se ha enviado un correo de confirmación. Por favor revisa tu bandeja de entrada o spam antes de ingresar."
      );
    }
  };

  return (
    <div className="card max-w-md mx-auto my-8 space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink mb-1">Crear cuenta gratis</h1>
        <p className="text-ink/60 text-sm">Tu primer paso hacia tu primer empleo.</p>
      </div>

      {exitoInfo && (
        <div className="p-4 bg-growth-50 border border-growth-500/30 rounded-xl text-xs text-growth-600 font-medium space-y-2">
          <p>{exitoInfo}</p>
          <Link href="/login" className="btn-primary text-xs w-full justify-center">
            Ir al inicio de sesión
          </Link>
        </div>
      )}

      {!exitoInfo && (
        <form onSubmit={handleRegistro} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Ej. María Pérez"
              className="input-field mb-0"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              className="input-field mb-0"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              className="input-field mb-0"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full text-sm py-2.5" disabled={loading}>
            {loading ? "Creando cuenta e iniciando sesión..." : "Registrarme"}
          </button>
        </form>
      )}

      <div className="pt-3 border-t border-primary-50 text-center">
        <p className="text-sm text-ink/60">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary-500 font-semibold hover:underline">
            Ingresa aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
