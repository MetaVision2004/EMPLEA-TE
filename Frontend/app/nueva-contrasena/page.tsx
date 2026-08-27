"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NuevaContrasenaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setReady(Boolean(session));
      if (!session) setError("El enlace no es válido o ya expiró. Solicita uno nuevo.");
    };

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    setTimeout(() => router.push("/login"), 1800);
  };

  if (saved) {
    return (
      <div className="mx-auto max-w-lg py-8 sm:py-14">
        <div className="card relative overflow-hidden text-center p-8 sm:p-10">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary-500 via-accent-500 to-growth-500" />
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-growth-50 text-3xl text-growth-600 shadow-soft">
            ✓
          </div>
          <h1 className="text-2xl font-display font-bold text-ink mb-2">Contraseña actualizada</h1>
          <p className="text-ink/60 text-sm mb-6">
          Tu contraseña fue cambiada correctamente. Te llevaremos al inicio de sesión.
          </p>
          <Link href="/login" className="btn-primary w-full block text-center">
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-6 sm:py-12">
      <div className="grid overflow-hidden rounded-3xl border border-primary-100 bg-white shadow-soft lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 p-8 text-white sm:p-10">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-white/20" />
          <div className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full border border-white/10" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div>
              <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl shadow-lg">
                🔐
              </span>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Seguridad de tu cuenta</p>
              <h1 className="max-w-xs text-3xl font-display font-bold leading-tight sm:text-4xl">
                Un nuevo comienzo, con más seguridad.
              </h1>
            </div>
            <p className="max-w-xs text-sm leading-6 text-white/75">
              Crea una contraseña que puedas recordar y que solo tú conozcas.
            </p>
          </div>
        </div>

        <div className="p-7 sm:p-10">
          <p className="eyebrow mb-3">Emplea-TE</p>
          <h2 className="text-2xl font-display font-bold text-ink mb-2">Nueva contraseña</h2>
          <p className="text-ink/60 text-sm mb-7">
            Elige una contraseña nueva para proteger tu cuenta.
          </p>

          {error && (
            <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <span aria-hidden="true">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs font-semibold text-ink/70">
              Nueva contraseña
              <input
                type="password"
                className="input-field mt-1 mb-0"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
                disabled={!ready || saving}
              />
            </label>
            <label className="block text-xs font-semibold text-ink/70">
              Confirmar contraseña
              <input
                type="password"
                className="input-field mt-1 mb-0"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                required
                disabled={!ready || saving}
              />
            </label>
            {ready ? (
              <button type="submit" className="btn-primary w-full py-3" disabled={saving}>
                {saving ? "Guardando..." : "Cambiar contraseña"}
              </button>
            ) : (
              <Link href="/recuperar-cuenta" className="btn-primary w-full block py-3 text-center">
                Solicitar otro enlace
              </Link>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-ink/45">
            ¿Recordaste tu contraseña? <Link href="/login" className="font-semibold text-primary-600 hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
