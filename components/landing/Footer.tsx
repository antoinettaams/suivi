"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-black/[0.06] bg-[#FAFAF8]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            {/* Logo identique à la Navbar avec l'icône assortie */}
            <a
              href="#"
              className="inline-flex items-center gap-2.5 text-xl font-extrabold tracking-[-0.04em] text-neutral-950 transition-opacity hover:opacity-90"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#5B5CE2] text-white shadow-sm shadow-[#5B5CE2]/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M8 13h8" />
                  <path d="M8 17h5" />
                  <circle cx="16" cy="17" r="1.2" className="fill-white stroke-none" />
                </svg>
              </div>

              <span className="flex items-baseline">
                reste<span className="text-[#5B5CE2]">.</span>
              </span>
            </a>

            <p className="mt-2 text-sm text-neutral-400">
              Suivez ce qu’il vous reste à encaisser.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <a
              href="#fonctionnement"
              className="text-neutral-500 transition-colors hover:text-neutral-950"
            >
              Fonctionnement
            </a>

            <a
              href="#tarifs"
              className="text-neutral-500 transition-colors hover:text-neutral-950"
            >
              Tarifs
            </a>

            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-semibold text-[#5B5CE2] transition-colors hover:text-[#4D4ED0]"
            >
              Commencer
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-black/[0.06] pt-6 text-xs text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} reste. Tous droits réservés.</p>

          <p>Simple. Clair. Sans prise de tête.</p>
        </div>
      </div>
    </footer>
  );
}