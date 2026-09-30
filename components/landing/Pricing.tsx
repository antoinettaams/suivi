"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Gratuit",
    slug: "gratuit",
    price: "0",
    description: "Pour commencer à organiser vos paiements.",
    features: [
      "Jusqu’à 10 clients",
      "Suivi des paiements", 
      "Calcul automatique du reste",
      "Historique des paiements",
    ],
    button: "Commencer gratuitement",
    highlighted: false,
  },
  {
    name: "Pro",
    slug: "pro",
    price: "1 000",
    description: "Pour gérer votre activité au quotidien.",
    features: [
      "Jusqu’à 100 clients",
      "Tout le plan Gratuit",
      "Rappels de paiement",
      "Suivi des échéances",
      "Suivi plus détaillé",
    ],
    button: "Choisir Pro",
    highlighted: true,
  },
  {
    name: "Business",
    slug: "business",
    price: "2 000",
    description:
      "Pour celles et ceux qui ont plus de clients à suivre.",
    features: [
      "Clients illimités",
      "Tout le plan Pro",
      "Export des données",
      "Historique complet",
    ],
    button: "Choisir Business",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section
      id="tarifs"
      className="relative overflow-hidden bg-[#FAFAF8] py-14 lg:py-24"
    >
      {/* Lumière décorative */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#5B5CE2]/[0.06] blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#5B5CE2]">
            Tarifs
          </span>

          <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-neutral-950 sm:text-5xl">
            Commencez gratuitement.
            <span className="block text-[#5B5CE2]">
              Passez à la suite quand vous voulez.
            </span>
          </h2>

          <p className="mt-5 text-lg leading-8 text-neutral-500">
            Pas besoin de payer pour découvrir si reste. vous convient.
          </p>
        </motion.div>

        {/* Cartes avec décalage visuel (Items 1 & 3 rabaissés) */}
        <div className="mx-auto mt-16 grid max-w-6xl items-start gap-6 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan, index) => {
            // Décalage pour abaisser les cartes de gauche et de droite sur écran large
            const isSidePlan = !plan.highlighted;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.65,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{
                  y: isSidePlan ? 26 : -6, // Animation hover préservant le décalage
                }}
                className={`relative flex flex-col rounded-3xl border p-7 transition-all duration-300 ${
                  isSidePlan ? "lg:mt-8" : ""
                } ${
                  plan.highlighted
                    ? "border-[#5B5CE2]/30 bg-white shadow-xl shadow-[#5B5CE2]/[0.08] hover:shadow-2xl hover:shadow-[#5B5CE2]/[0.12] lg:-translate-y-2"
                    : "border-black/[0.06] bg-white shadow-sm hover:shadow-xl hover:shadow-black/[0.04]"
                }`}
              >
                {/* Badge du forfait Pro */}
                {plan.highlighted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: 0.3,
                    }}
                    className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#5B5CE2] px-4 py-1.5 text-xs font-bold text-white shadow-md"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Le plus populaire
                  </motion.div>
                )}

                {/* Nom + description */}
                <div>
                  <h3 className="text-lg font-bold text-neutral-950">
                    {plan.name}
                  </h3>

                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-neutral-500">
                    {plan.description}
                  </p>
                </div>

                {/* Prix */}
                <div className="mt-7 flex items-end gap-1">
                  <span className="text-4xl font-extrabold tracking-[-0.04em] text-neutral-950">
                    {plan.price}
                  </span>

                  <span className="mb-1.5 text-sm text-neutral-400">
                    F / mois
                  </span>
                </div>

                {/* Bouton */}
                <Link
                  href={`/login?plan=${plan.slug}`}
                  className={`mt-7 flex w-full items-center justify-center rounded-full px-5 py-3.5 text-sm font-bold transition-all ${
                    plan.highlighted
                      ? "bg-[#5B5CE2] text-white shadow-lg shadow-[#5B5CE2]/20 hover:-translate-y-0.5 hover:bg-[#4D4ED0] hover:shadow-xl"
                      : "border border-black/[0.08] bg-white text-neutral-700 hover:-translate-y-0.5 hover:border-black/[0.15] hover:shadow-sm"
                  }`}
                >
                  {plan.button}
                </Link>

                {/* Séparateur */}
                <div className="my-7 h-px bg-black/[0.06]" />

                {/* Inclus */}
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                  Inclus
                </p>

                <ul className="mt-5 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-neutral-600"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#E7F7EC]">
                        <Check className="h-2.5 w-2.5 text-[#16A34A]" />
                      </span>

                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.6,
            delay: 0.2,
          }}
          className="mt-12 text-center text-sm text-neutral-400"
        >
          Aucun engagement. Vous pouvez changer de formule quand vous le
          souhaitez.
        </motion.p>
      </div>
    </section>
  );
}