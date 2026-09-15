type BrandLogoProps = {
  className?: string;
};

export default function BrandLogo({ className = "h-auto w-full" }: BrandLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Emplea-TE"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <circle cx="32" cy="32" r="32" fill="#EFFBFC" />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#B0E4E9" strokeWidth="1" />

      <rect x="16" y="30" width="32" height="21" rx="3" fill="none" stroke="#176681" strokeWidth="3.2" />
      <rect x="16" y="30" width="32" height="7" fill="none" stroke="#176681" strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M25 30v-5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v5" fill="none" stroke="#176681" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M21 26 32 15 43 26" fill="none" stroke="#D59D22" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 15v10" stroke="#D59D22" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
