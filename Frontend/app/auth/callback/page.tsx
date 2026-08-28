"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Verificando tu enlace...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeAuth = async () => {
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError("Este enlace ha caducado o ya fue utilizado.");
          return;
        }
      } else if (tokenHash && type) {
        const validTypes = ["signup", "invite", "magiclink", "recovery", "email_change", "reauthentication"] as const;
        if (!validTypes.includes(type as (typeof validTypes)[number])) {
          setError("El tipo de enlace no es válido.");
          return;
        }

        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as (typeof validTypes)[number],
        });
        if (verifyError) {
          setError("Este enlace ha caducado o ya fue utilizado.");
          return;
        }
      }

      if (type === "recovery") {
        router.replace("/nueva-contrasena");
        return;
      }

      const destinations: Record<string, string> = {
        signup: "/auth/confirm-signup?verified=1",
        invite: "/auth/invite?accepted=1",
        magiclink: "/auth/magic-link?authenticated=1",
        email_change: "/auth/change-email?updated=1",
        reauthentication: "/auth/reauthentication?verified=1",
      };
      const destination = destinations[type ?? ""];
      if (destination) {
        router.replace(destination);
        return;
      }

      router.replace("/perfil");
    };

    completeAuth();
  }, [router, searchParams]);

  return (
    <div className="card mx-auto my-12 max-w-md text-center">
      {error ? (
        <>
          <h1 className="mb-3 text-2xl font-display font-bold text-ink">Enlace no disponible</h1>
          <p className="mb-6 text-sm text-red-700">{error}</p>
          <a href="/login" className="btn-primary w-full">Volver al inicio de sesión</a>
        </>
      ) : (
        <>
          <h1 className="mb-3 text-2xl font-display font-bold text-primary-700">Emplea-TE</h1>
          <p className="text-sm text-ink/60">{message}</p>
        </>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="card mx-auto my-12 max-w-md text-center">Verificando tu enlace...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
