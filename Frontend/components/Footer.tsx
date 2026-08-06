export default function Footer() {
  return (
    <footer className="border-t border-primary-100 mt-16">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink/60">
        <p className="font-display font-semibold text-ink">
          Emplea<span className="text-accent-500">-TE</span>
        </p>
        <p>Apoyo para dar tu primer paso al mundo laboral.</p>
        <p>&copy; {new Date().getFullYear()} Emplea-TE</p>
      </div>
    </footer>
  );
}
