import Link from "next/link";

const PASOS = [
  {
    numero: "01",
    titulo: "Crea tu perfil",
    texto: "Cuéntanos tu formación, tus habilidades y sube tu CV en minutos.",
  },
  {
    numero: "02",
    titulo: "Explora ofertas",
    texto: "Filtra oportunidades pensadas para quienes buscan su primer empleo.",
  },
  {
    numero: "03",
    titulo: "Da seguimiento",
    texto: "Sigue cada postulación paso a paso, desde aplicado hasta contratado.",
  },
];

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="grid md:grid-cols-2 gap-10 items-center py-10 md:py-16">
        <div>
          <p className="eyebrow mb-3">Tu primer paso cuenta</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-5">
            Del último examen a tu{" "}
            <span className="text-primary-500">primer empleo</span>.
          </h1>
          <p className="text-ink/70 text-lg mb-8 max-w-md">
            Emplea-TE acompaña a quienes buscan trabajo por primera vez: arma
            tu perfil, postúlate a ofertas hechas para ti y da seguimiento a
            cada proceso en un solo lugar.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/registro" className="btn-primary">
              Crear cuenta gratis
            </Link>
            <Link href="/ofertas" className="btn-outline">
              Ver ofertas
            </Link>
          </div>
        </div>

        {/* Ilustración: escalera del primer paso */}
        <div className="flex justify-center md:justify-end">
          <svg
            viewBox="0 0 320 240"
            className="w-full max-w-sm"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Ilustración de una escalera ascendente que representa el progreso hacia el primer empleo"
          >
            <rect x="10" y="190" width="70" height="40" rx="8" fill="#EAF3F1" />
            <rect x="90" y="150" width="70" height="80" rx="8" fill="#CFE3DF" />
            <rect x="170" y="105" width="70" height="125" rx="8" fill="#A3C8C1" />
            <rect x="250" y="55" width="60" height="175" rx="8" fill="#0E4F45" />
            <circle cx="280" cy="35" r="16" fill="#F0552F" />
            <path
              d="M280 51 v14 M280 58 l-10 10 M280 58 l10 10 M280 65 l-8 12 M280 65 l8 12"
              stroke="#F0552F"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="grid grid-cols-3 gap-4 py-6 border-y border-primary-100">
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-display font-bold text-primary-500">100%</p>
          <p className="text-xs md:text-sm text-ink/60">Gratis para postulantes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-display font-bold text-primary-500">0</p>
          <p className="text-xs md:text-sm text-ink/60">Experiencia previa requerida</p>
        </div>
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-display font-bold text-primary-500">1</p>
          <p className="text-xs md:text-sm text-ink/60">Lugar para todo tu proceso</p>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="py-16">
        <h2 className="text-2xl font-display font-bold text-center mb-10">
          Cómo funciona
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PASOS.map((paso, i) => (
            <div
              key={paso.numero}
              className="card"
              style={{ marginTop: i === 0 ? "2rem" : i === 1 ? "1rem" : "0" }}
            >
              <span className="font-display text-3xl font-bold text-primary-100">
                {paso.numero}
              </span>
              <h3 className="font-semibold text-lg mt-2 mb-1">{paso.titulo}</h3>
              <p className="text-sm text-ink/60">{paso.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-primary-500 rounded-2xl px-8 py-12 text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
          Tu primer empleo empieza con un perfil.
        </h2>
        <p className="text-white/80 mb-6 max-w-md mx-auto">
          Crea tu cuenta hoy y postúlate a tu primera oportunidad en minutos.
        </p>
        <Link href="/registro" className="btn-primary bg-accent-500">
          Empezar ahora
        </Link>
      </section>
    </div>
  );
}
