"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { triggerEmail } from "@/lib/email";

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Crea el perfil extendido si el usuario quedó autenticado
    if (data.user) {
      const { error: perfilError } = await supabase.from("perfiles").insert({
        id: data.user.id,
        nombre,
      });
      if (perfilError) {
        setError(perfilError.message);
        setLoading(false);
        return;
      }

      // Envía email de bienvenida (no bloquea el flujo)
      triggerEmail.welcome({ name: nombre, email });
    }

    setLoading(false);
    router.push("/perfil");
  };

  return (
    <div className="card max-w-md mx-auto">
      <h1 className="text-2xl font-display font-bold mb-1">Crear cuenta</h1>
      <p className="text-ink/60 text-sm mb-5">Tu primer paso hacia tu primer empleo.</p>
      <form onSubmit={handleRegistro}>
        <input
          type="text"
          placeholder="Nombre completo"
          className="input-field"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
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
          placeholder="Contraseña (mínimo 6 caracteres)"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creando cuenta..." : "Registrarme"}
        </button>
      </form>
      <p className="text-sm text-ink/60 mt-4">
        ¿Ya tienes cuenta? <a href="/login" className="text-primary-500 font-medium">Ingresa aquí</a>
      </p>
    </div>
  );
}
