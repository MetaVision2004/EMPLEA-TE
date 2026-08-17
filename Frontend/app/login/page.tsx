"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { isAdmin } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const translateError = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes("invalid login credentials")) {
      return "Correo o contraseña incorrectos. Por favor verifica tus credenciales o regístrate si no tienes cuenta.";
    }
    if (lower.includes("email not confirmed")) {
      return "Tu correo electrónico aún no ha sido confirmado. Por favor revisa tu bandeja de entrada o spam.";
    }
    if (lower.includes("user not found")) {
      return "No encontramos ninguna cuenta registrada con este correo.";
    }
    if (lower.includes("too many requests") || lower.includes("rate limit")) {
      return "Demasiados intentos fallidos. Por favor espera unos minutos e intenta de nuevo.";
    }
    return msg;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (loginError) {
      setError(translateError(loginError.message));
      return;
    }

    // Redirigir según rol
    const loggedEmail = email.trim().toLowerCase();
    if (isAdmin(loggedEmail)) {
      router.push("/admin/ofertas");
    } else {
      router.push("/perfil");
    }
  };

  return (
    <div className="card max-w-md mx-auto my-8 space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink mb-1">Ingresar a tu cuenta</h1>
        <p className="text-ink/60 text-sm">Accede a tus postulaciones, ofertas y perfil.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-3">
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
            placeholder="••••••••"
            className="input-field mb-0"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end pt-1">
          <Link
            href="/recuperar-cuenta"
            className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full text-sm py-2.5" disabled={loading}>
          {loading ? "Verificando credenciales..." : "Ingresar"}
        </button>
      </form>

      <div className="pt-3 border-t border-primary-50 text-center">
        <p className="text-sm text-ink/60">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/registro" className="text-accent-500 font-semibold hover:underline">
            Crea tu cuenta aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
