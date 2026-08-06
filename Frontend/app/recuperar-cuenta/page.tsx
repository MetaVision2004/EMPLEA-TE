"use client";

import { useState } from "react";

export default function RecuperarCuentaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // El backend genera el link con supabaseAdmin y lo envía con Resend.
      // No usamos supabase.auth.resetPasswordForEmail para evitar el rate limit.
      const res = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") +
          "/api/email/recuperar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al enviar el correo.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido.";
      setError(message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 32,
          }}
        >
          📬
        </div>

        <h1 className="text-2xl font-display font-bold mb-2">
          ¡Revisa tu correo!
        </h1>
        <p className="text-ink/60 text-sm mb-6">
          Si la dirección <strong className="text-ink">{email}</strong> está
          registrada, recibirás un enlace para restablecer tu contraseña en los
          próximos minutos.
        </p>

        <div
          style={{
            background: "#f5f3ff",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "#4338ca", lineHeight: 1.6 }}>
            💡 <strong>Consejo:</strong> revisa también tu carpeta de{" "}
            <em>spam</em> o <em>correo no deseado</em> si no ves el mensaje.
          </p>
        </div>

        <a href="/login" className="btn-primary w-full block text-center">
          Volver al inicio de sesión
        </a>
      </div>
    );
  }

  return (
    <div className="card max-w-md mx-auto">
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            marginBottom: 12,
          }}
        >
          🔐
        </div>
        <h1 className="text-2xl font-display font-bold mb-1">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="text-ink/60 text-sm">
          Ingresa tu correo y te enviaremos un enlace para recuperar tu cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          id="recover-email"
          type="email"
          placeholder="Correo electrónico"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        {error && (
          <p className="text-red-600 text-sm mb-3">
            ⚠️ {error}
          </p>
        )}

        <button
          type="submit"
          id="btn-enviar-recuperar"
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar enlace de recuperación"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-4 text-center">
        ¿Recordaste tu contraseña?{" "}
        <a href="/login" className="text-primary-500 font-medium">
          Inicia sesión
        </a>
      </p>
    </div>
  );
}
