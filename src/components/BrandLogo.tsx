import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
}

export default function BrandLogo({ className = "h-11 sm:h-12 w-auto", showText = true }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Icon portion (the green angled discount tag with percent arrow) */}
      <svg
        viewBox="0 0 120 120"
        className="h-10 w-10 sm:h-11 sm:w-11 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* String Loop / Ring */}
        <path
          d="M86 28C92 18 106 18 108 28C109 36 98 42 91 38"
          stroke="#5CE1B2"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Outer Tag Body - Rotated around the upper-right area */}
        <rect
          x="24"
          y="36"
          width="54"
          height="88"
          rx="14"
          transform="rotate(-35 24 36)"
          stroke="#5CE1B2"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Tag Hole / Eyelet */}
        <circle cx="83" cy="33" r="4.5" fill="#5CE1B2" />
        
        {/* Slash of the percent sign (rendered as an arrow pointing top-right) */}
        <path
          d="M48 82L78 50"
          stroke="#5CE1B2"
          strokeWidth="5"
          strokeLinecap="round"
        />
        
        {/* Arrow Head pointing top-right */}
        <path
          d="M66 50H78V62"
          stroke="#5CE1B2"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Upper-left dot of percent */}
        <circle cx="51" cy="54" r="5" stroke="#5CE1B2" strokeWidth="4.5" fill="none" />
        
        {/* Lower-right dot of percent */}
        <circle cx="72" cy="76" r="5" stroke="#5CE1B2" strokeWidth="4.5" fill="none" />
      </svg>

      {/* Text portion (Oberá en Oferta) */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className="font-display font-black text-xl sm:text-2xl tracking-wide text-[#2B0E67] dark:text-zinc-50">
            OBERÁ
          </span>
          <span className="font-sans font-bold text-[11px] sm:text-[12px] tracking-[0.18em] text-[#2B0E67] dark:text-indigo-300 mt-1 uppercase">
            EN OFERTA
          </span>
        </div>
      )}
    </div>
  );
}
