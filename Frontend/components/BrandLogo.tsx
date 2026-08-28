type BrandLogoProps = {
  className?: string;
};

export default function BrandLogo({ className = "h-auto w-full" }: BrandLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 500 270"
      role="img"
      aria-label="Emplea-TE"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <g transform="translate(190 4) scale(2.35)">
        <path d="M4 29 14 39 36 17" stroke="#55C7D2" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 39 38 15" stroke="#123F69" strokeWidth="4" strokeLinecap="round" />
        <path d="m38 15-2 12-9-8 11-4Z" fill="#123F69" />
        <path d="m43 2 1.5 3.5 4 .5-3 2.5.8 4-3.3-1.8-3.3 1.8.8-4-3-2.5 4-.5L43 2Z" fill="#E7B638" />
      </g>
      <text x="250" y="255" textAnchor="middle" textLength="340" lengthAdjust="spacingAndGlyphs" fill="#123F69" fontFamily="Arial, sans-serif" fontSize="57" fontWeight="700">Emplea<tspan fill="#43B5C3">-TE</tspan></text>
    </svg>
  );
}
