"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isAdmin } from "@/lib/auth";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Estado de sesión
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    router.push("/login");
  };

  // Determinar si el usuario es administrador
  const userIsAdmin = isAdmin(user?.email);

  const linkClass = (href: string) =>
    `text-sm transition-colors ${
      pathname === href
        ? "text-primary-700 font-semibold"
        : "text-ink/65 hover:text-primary-700"
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

  const activeLinks = userIsAdmin ? adminLinks : publicLinks;

  return (
    <header className="sticky top-0 z-30 border-b border-primary-100 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
        {/* LOGO & BADGE DE ROL */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-primary-700">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-700 to-primary-500 ring-1 ring-primary-100 shadow-sm">
              <svg viewBox="0 0 40 40" aria-hidden="true" className="h-8 w-8">
                <path d="M8 24 16 32 33 10" fill="none" stroke="#67e8f9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
                <path d="m18 25 15-15" fill="none" stroke="#f6c453" strokeLinecap="round" strokeWidth="3" />
                <path d="m31 7 1.5 3.5L36 12l-3.5 1.5L31 17l-1.5-3.5L26 12l3.5-1.5L31 7Z" fill="#f6c453" />
              </svg>
            </span>
            <span className="font-display font-bold text-lg tracking-tight">
              Emplea<span className="text-accent-500">-TE</span>
            </span>
          </Link>

          {/* Badge de rol (visible si logged in) */}
          {user && (
            <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-xl text-xs font-medium border ${
              userIsAdmin
                ? "bg-accent-50 text-accent-700 border-accent-200"
                : "bg-primary-50 text-primary-700 border-primary-100"
            }`}>
              {userIsAdmin ? "🔒 Administrador" : "🌐 Candidato"}
            </span>
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

              <div className="h-4 w-px bg-primary-100" />

              {/* Tag Usuario Autenticado */}
              <span
                className="max-w-[140px] truncate rounded-lg bg-primary-50 px-2.5 py-1 text-xs text-primary-700"
                title={user.email}
              >
                👤 {user.email?.split("@")[0]}
              </span>

              {/* Botón Logout */}
              <button
                onClick={handleLogout}
                className="rounded-xl border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-medium text-accent-700 transition-colors hover:bg-accent-500 hover:text-white"
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
                className="rounded-xl border border-primary-200 px-4 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
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
          className="-mr-2 p-2 text-primary-700 md:hidden"
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
        <div className="flex flex-col gap-3 border-t border-primary-100 bg-white px-6 pb-4 pt-2 md:hidden">
          {user && (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-primary-50 p-2 text-xs">
              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                userIsAdmin ? "bg-accent-500 text-white" : "bg-white text-primary-600"
              }`}>
                {userIsAdmin ? "🔒 Administrador" : "🌐 Candidato"}
              </span>
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
              <div className="flex items-center justify-between border-t border-primary-100 pt-2 text-xs text-ink/60">
                <span>{user.email}</span>
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="font-bold text-accent-600 hover:underline"
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
                className="text-sm font-medium text-primary-700"
                onClick={() => setOpen(false)}
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="text-sm font-medium text-accent-600"
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
