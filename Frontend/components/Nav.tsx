"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Estado de sesión
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Modo activo: "publico" (Candidato) | "privado" (Admin)
  const [modo, setModo] = useState<"publico" | "privado">("publico");

  useEffect(() => {
    // Si la ruta actual es /admin/..., sincronizar modo privado automáticamente
    if (pathname.startsWith("/admin")) {
      setModo("privado");
    }

    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser ? { id: currentUser.id, email: currentUser.email } : null);
      setLoading(false);
    };

    checkUser();

    // Listener de cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setModo("publico");
    router.push("/login");
  };

  const toggleModo = (nuevoModo: "publico" | "privado") => {
    setModo(nuevoModo);
    if (nuevoModo === "privado") {
      router.push("/admin/ofertas");
    } else {
      router.push("/ofertas");
    }
  };

  const linkClass = (href: string) =>
    `text-sm transition-colors ${
      pathname === href
        ? "text-white font-semibold underline underline-offset-4"
        : "text-white/80 hover:text-white"
    }`;

  // Enlaces según el modo activo
  const publicLinks = [
    { href: "/ofertas", label: "Ofertas" },
    { href: "/postulaciones", label: "Mis postulaciones" },
    { href: "/perfil", label: "Mi perfil" },
  ];

  const adminLinks = [
    { href: "/admin/ofertas", label: "Panel Admin Ofertas" },
    { href: "/perfil", label: "Mi perfil" },
  ];

  const activeLinks = modo === "privado" ? adminLinks : publicLinks;

  return (
    <header className="bg-primary-500 sticky top-0 z-30 shadow-md">
      <nav className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        {/* LOGO & BADGE DE MODO */}
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-1">
            Emplea<span className="text-accent-300">-TE</span>
          </Link>

          {/* Selector de Modo Público / Privado (visible si logged in) */}
          {user && (
            <div className="hidden sm:inline-flex bg-primary-600/80 p-0.5 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => toggleModo("publico")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  modo === "publico"
                    ? "bg-white text-primary-600 shadow-xs"
                    : "text-white/70 hover:text-white"
                }`}
                title="Modo Público para postulantes"
              >
                🌐 Público
              </button>
              <button
                onClick={() => toggleModo("privado")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  modo === "privado"
                    ? "bg-accent-500 text-white shadow-xs"
                    : "text-white/70 hover:text-white"
                }`}
                title="Modo Privado para administradores"
              >
                🔒 Privado Admin
              </button>
            </div>
          )}
        </div>

        {/* ENLACES DE ESCRITORIO */}
        <div className="hidden md:flex items-center gap-5">
          {!loading && user ? (
            <>
              {activeLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                  {link.label}
                </Link>
              ))}

              <div className="h-4 w-px bg-white/20" />

              {/* Tag Usuario Autenticado */}
              <span
                className="text-xs text-white/90 bg-white/10 px-2.5 py-1 rounded-lg max-w-[140px] truncate"
                title={user.email}
              >
                👤 {user.email?.split("@")[0]}
              </span>

              {/* Botón Logout */}
              <button
                onClick={handleLogout}
                className="text-xs bg-accent-500/20 text-white border border-accent-300/30 px-3 py-1.5 rounded-xl hover:bg-accent-500 transition-colors font-medium"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/ofertas" className={linkClass("/ofertas")}>
                Ver ofertas
              </Link>
              <Link
                href="/login"
                className="text-sm bg-white/10 text-white px-4 py-1.5 rounded-xl hover:bg-white/20 transition-colors font-medium"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="text-sm bg-accent-500 text-white px-4 py-1.5 rounded-xl hover:bg-accent-600 transition-colors font-medium"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* BOTÓN MENÚ MÓVIL */}
        <button
          className="md:hidden text-white p-2 -mr-2"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* PANEL MÓVIL */}
      {open && (
        <div className="md:hidden bg-primary-600 px-6 pb-4 pt-2 flex flex-col gap-3 border-t border-white/10">
          {user && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-primary-700/60 rounded-xl text-xs">
              <span className="text-white/80 font-medium">Modo:</span>
              <button
                onClick={() => {
                  toggleModo("publico");
                  setOpen(false);
                }}
                className={`px-2 py-1 rounded-md text-xs font-semibold ${
                  modo === "publico" ? "bg-white text-primary-600" : "text-white/70"
                }`}
              >
                🌐 Público
              </button>
              <button
                onClick={() => {
                  toggleModo("privado");
                  setOpen(false);
                }}
                className={`px-2 py-1 rounded-md text-xs font-semibold ${
                  modo === "privado" ? "bg-accent-500 text-white" : "text-white/70"
                }`}
              >
                🔒 Privado Admin
              </button>
            </div>
          )}

          {user ? (
            <>
              {activeLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={linkClass(link.href)}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <span>{user.email}</span>
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="text-accent-300 font-bold hover:underline"
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/ofertas"
                className={linkClass("/ofertas")}
                onClick={() => setOpen(false)}
              >
                Ver ofertas
              </Link>
              <Link
                href="/login"
                className="text-sm text-white font-medium"
                onClick={() => setOpen(false)}
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="text-sm text-accent-300 font-medium"
                onClick={() => setOpen(false)}
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
