"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="relative z-50 border-b border-black/[0.06] bg-[#FAFAF8]/90 backdrop-blur-md">
      {/* Conteneur : Flex sur mobile, Grid (3 colonnes) sur Desktop */}
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:grid md:grid-cols-[1fr_auto_1fr] lg:px-8">
        
        {/* Logo avec icône SVG personnalisée respectant votre couleur #5B5CE2 */}
        <div className="md:justify-self-start">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-extrabold tracking-[-0.04em] text-neutral-950 transition-opacity hover:opacity-90"
          >
            {/* Pictogramme d'application (Carnet / Reçu d'acompte) */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B5CE2] text-white shadow-sm shadow-[#5B5CE2]/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4.5 w-4.5"
              >
                {/* Structure du reçu */}
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                {/* Ligne d'acompte + point de reste */}
                <path d="M8 13h8" />
                <path d="M8 17h5" />
                <circle cx="16" cy="17" r="1.2" className="fill-white stroke-none" />
              </svg>
            </div>

            {/* Texte de la marque */}
            <span className="flex items-baseline">
              reste<span className="text-[#5B5CE2]">.</span>
            </span>
          </Link>
        </div>

        {/* Navigation centrée (Desktop) */}
        <div className="hidden items-center gap-10 md:flex md:justify-self-center">
          <a
            href="#fonctionnement"
            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950"
          >
            Comment ça marche
          </a>

          <a
            href="#tarifs"
            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950"
          >
            Tarifs
          </a>
        </div>

        {/* Actions (Desktop) */}
        <div className="hidden items-center gap-3 justify-self-end md:flex">
          <Link
            href="/login"
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-black/[0.04]"
          >
            Se connecter
          </Link>

          <Link
            href="/login"
            className="rounded-full bg-[#5B5CE2] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#4D4ED0] hover:shadow-md"
          >
            Commencer gratuitement
          </Link>
        </div>

        {/* Bouton Menu Mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-full p-2 text-neutral-700 transition-colors hover:bg-black/[0.05] md:hidden"
          aria-label="Ouvrir le menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Menu déroulant mobile */}
      {mobileMenuOpen && (
        <div className="border-t border-black/[0.06] bg-[#FAFAF8] px-6 pb-6 pt-2 md:hidden">
          <div className="flex flex-col gap-2 pt-2">
            <a
              href="#fonctionnement"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-black/[0.04]"
            >
              Comment ça marche
            </a>

            <a
              href="#tarifs"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-black/[0.04]"
            >
              Tarifs
            </a>

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-1 rounded-xl px-4 py-3 text-center text-sm font-semibold text-neutral-700 border border-black/[0.08] transition-colors hover:bg-black/[0.04]"
            >
              Se connecter
            </Link>

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-1 rounded-xl bg-[#5B5CE2] px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4D4ED0]"
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}