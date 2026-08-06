"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/ofertas", label: "Ofertas" },
  { href: "/perfil", label: "Mi perfil" },
  { href: "/postulaciones", label: "Mis postulaciones" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    `text-sm transition-colors ${
      pathname === href
        ? "text-white font-semibold"
        : "text-white/70 hover:text-white"
    }`;

  return (
    <header className="bg-primary-500 sticky top-0 z-30">
      <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-lg text-white tracking-tight">
          Emplea<span className="text-accent-300">-TE</span>
        </Link>

        {/* Enlaces de escritorio */}
        <div className="hidden md:flex items-center gap-6">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors font-medium"
          >
            Ingresar
          </Link>
        </div>

        {/* Botón menú móvil */}
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

      {/* Panel móvil */}
      {open && (
        <div className="md:hidden bg-primary-600 px-6 pb-4 flex flex-col gap-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.href)}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm text-white font-medium"
            onClick={() => setOpen(false)}
          >
            Ingresar
          </Link>
        </div>
      )}
    </header>
  );
}
