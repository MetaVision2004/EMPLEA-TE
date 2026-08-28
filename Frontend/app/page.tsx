import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

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
    <div className="space-y-16 pb-6 sm:space-y-24">
      <section className="grid items-center gap-12 pt-6 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:pt-12">
        <div>
          <p className="eyebrow mb-4">Tu primer paso cuenta</p>
          <h1 className="mb-6 max-w-2xl text-4xl font-display font-bold leading-[1.08] tracking-tight md:text-6xl">
            Del último examen a tu{" "}
            <span className="text-primary-500">primer empleo.</span>
          </h1>
          <p className="mb-8 max-w-xl text-lg leading-8 text-ink/70">
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

        <div className="relative overflow-hidden rounded-[2rem] border border-primary-100 bg-white p-6 shadow-soft sm:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border-[24px] border-primary-100/70" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full border-[18px] border-accent-100/70" />
          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600">Tu ruta profesional</span>
              <span className="rounded-full bg-growth-50 px-3 py-1 text-xs font-semibold text-growth-600">En marcha</span>
            </div>
            <div className="logo-stage mx-auto mb-8 flex min-h-40 w-full max-w-sm items-center justify-center overflow-hidden rounded-[2rem] border border-primary-100/80 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-3 shadow-lift ring-8 ring-primary-50/70 sm:min-h-48 sm:p-4">
              <BrandLogo className="h-auto w-full max-w-[31rem]" />
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-primary-100 pt-5 text-center">
              <div><p className="font-display text-lg font-bold text-primary-700">01</p><p className="text-[11px] text-ink/55">Perfil</p></div>
              <div><p className="font-display text-lg font-bold text-primary-700">02</p><p className="text-[11px] text-ink/55">Ofertas</p></div>
              <div><p className="font-display text-lg font-bold text-accent-500">03</p><p className="text-[11px] text-ink/55">Avanza</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 divide-y divide-primary-100 border-y border-primary-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="text-center">
          <p className="py-5 font-display text-3xl font-bold text-primary-500">100%</p>
          <p className="-mt-4 pb-5 text-xs text-ink/60">Gratis para postulantes</p>
        </div>
        <div className="text-center">
          <p className="py-5 font-display text-3xl font-bold text-primary-500">0</p>
          <p className="-mt-4 pb-5 text-xs text-ink/60">Experiencia previa requerida</p>
        </div>
        <div className="text-center">
          <p className="py-5 font-display text-3xl font-bold text-primary-500">1</p>
          <p className="-mt-4 pb-5 text-xs text-ink/60">Lugar para todo tu proceso</p>
        </div>
      </section>

      <section>
        <div className="mb-10 flex items-end justify-between gap-5">
          <div><p className="eyebrow mb-2">El proceso</p><h2 className="text-3xl font-display font-bold text-ink">Cómo funciona</h2></div>
          <span className="hidden text-sm text-ink/50 sm:block">Tres pasos para empezar</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PASOS.map((paso, i) => (
            <div
              key={paso.numero}
              className={`rounded-2xl border p-6 ${i === 2 ? "border-accent-200 bg-accent-50/60" : "border-primary-100 bg-white"}`}
            >
              <span className="font-display text-sm font-bold text-accent-500">{paso.numero}</span>
              <h3 className="mb-2 mt-8 text-xl font-semibold">{paso.titulo}</h3>
              <p className="text-sm leading-6 text-ink/60">{paso.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] bg-primary-700 px-6 py-12 text-center sm:px-10">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[28px] border-white/10" />
        <h2 className="relative mb-3 text-2xl font-display font-bold text-white md:text-3xl">
          Tu primer empleo empieza con un perfil.
        </h2>
        <p className="relative mx-auto mb-6 max-w-md text-white/75">
          Crea tu cuenta hoy y postúlate a tu primera oportunidad en minutos.
        </p>
        <Link href="/registro" className="btn-primary relative bg-accent-500 hover:bg-accent-400">
          Empezar ahora
        </Link>
      </section>
    </div>
  );
}
