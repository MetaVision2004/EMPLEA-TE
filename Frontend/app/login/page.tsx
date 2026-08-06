"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    router.push("/perfil");
  };

  return (
    <div className="card max-w-md mx-auto">
      <h1 className="text-2xl font-display font-bold mb-1">Ingresar</h1>
      <p className="text-ink/60 text-sm mb-5">Continúa tu búsqueda de empleo.</p>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Correo electrónico"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex justify-end mb-3">
          <a
            href="/recuperar-cuenta"
            className="text-xs text-primary-500 hover:text-primary-700 font-medium transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <p className="text-sm text-ink/60 mt-4">
        ¿No tienes cuenta? <a href="/registro" className="text-primary-500 font-medium">Regístrate</a>
      </p>
    </div>
  );
}
