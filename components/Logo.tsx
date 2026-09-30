import React from "react";

interface LogoProps {
  showText?: boolean;
  className?: string;
}

export function Logo({ showText = true, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Icône SVG App */}
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5B5CE2] to-[#4D4ED0] text-white shadow-md shadow-[#5B5CE2]/25">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          {/* Forme du reçu / carnet */}
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          {/* Ligne d'acompte & Solde validé */}
          <path d="M8 13h8" />
          <path d="M8 17h5" />
          <circle cx="16" cy="17" r="1.5" className="fill-white/80 stroke-none" />
        </svg>
      </div>

      {/* Texte reste. */}
      {showText && (
        <span className="flex items-baseline text-2xl font-extrabold tracking-tight text-neutral-950">
          reste
          <span className="ml-0.5 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-[#5B5CE2]"></span>
        </span>
      )}
    </div>
  );
}