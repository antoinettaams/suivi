"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-white py-24 lg:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5B5CE2]/[0.06] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative mx-auto max-w-5xl px-6 lg:px-8"
      >
        <div className="overflow-hidden rounded-[2rem] bg-[#171717] px-6 py-14 text-center sm:px-12 sm:py-16 lg:px-20 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-300">
              Simplement, reste.
            </span>

            <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Arrêtez de chercher.
              <span className="block text-[#8B8CF0]">
                Commencez à suivre.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-neutral-400 sm:text-lg">
              Centralisez vos acomptes, vos paiements et vos restes à payer
              dans un seul endroit.
            </p>

            <Link
              href="/login"
              className="group mt-9 inline-flex items-center gap-2 rounded-full bg-[#5B5CE2] px-7 py-4 text-sm font-bold text-white shadow-xl shadow-[#5B5CE2]/20 transition-all hover:-translate-y-0.5 hover:bg-[#6A6BE8] hover:shadow-2xl"
            >
              Commencer gratuitement
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3">
              {[
                "Aucune carte bancaire",
                "Installation rapide",
                "Commencez gratuitement",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-neutral-500"
                >
                  <Check className="h-3.5 w-3.5 text-[#8B8CF0]" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}