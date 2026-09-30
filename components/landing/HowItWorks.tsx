"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  ClipboardPlus,
  CreditCard,
  WalletCards,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardPlus,
    title: "Ajoutez une commande",
    description:
      "Enregistrez simplement votre client, le montant total et ce qu’il doit payer.",
  },
  {
    number: "02",
    icon: CreditCard,
    title: "Enregistrez les paiements",
    description:
      "Acompte, paiement partiel ou règlement complet : ajoutez chaque paiement en quelques secondes.",
  },
  {
    number: "03",
    icon: WalletCards,
    title: "Voyez ce qu’il reste",
    description:
      "Le montant restant est calculé automatiquement. Vous savez immédiatement qui vous doit encore de l’argent.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="fonctionnement"
      className="relative overflow-hidden bg-white  lg:py-15"
    >
      {/* MÊME CONTENEUR ET PADDING LATÉRAL QUE LE HERO : max-w-7xl px-6 lg:px-8 */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#5B5CE2] sm:text-sm">
            Comment ça marche
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-neutral-950 sm:text-4xl lg:text-5xl">
            Trois étapes.{" "}
            <span className="block text-[#5B5CE2]">
              Rien de compliqué.
            </span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-neutral-500 sm:text-lg">
            En quelques secondes, vous savez ce qui a été payé et ce qu’il
            reste à encaisser.
          </p>
        </motion.div>

        {/* Étapes */}
        <div className="relative mt-16 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {/* Ligne décorative horizontale sur Desktop (ajustée pour s'aligner parfaitement aux icônes) */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="pointer-events-none absolute left-[15%] right-[15%] top-[36px] hidden h-px origin-left bg-[#5B5CE2]/15 lg:block"
          />

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.number}
                initial={{
                  opacity: 0,
                  y: 40,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.25,
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.15 + index * 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative"
              >
                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Icône */}
                  <motion.div
                    initial={{ rotate: -6 }}
                    whileInView={{ rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: 0.3 + index * 0.15,
                    }}
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-[#5B5CE2]/10 bg-[#EEF0FF] shadow-sm"
                  >
                    <Icon className="h-7 w-7 text-[#5B5CE2]" />
                  </motion.div>

                  <span className="mt-5 text-xs font-bold tracking-[0.2em] text-[#5B5CE2]/70">
                    ÉTAPE {step.number}
                  </span>

                  <h3 className="mt-2 text-xl font-bold tracking-[-0.02em] text-neutral-950">
                    {step.title}
                  </h3>

                  <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-neutral-500 sm:text-base">
                    {step.description}
                  </p>
                </div>

                {/* Flèche mobile */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.3,
                      delay: 0.4 + index * 0.15,
                    }}
                    className="absolute -bottom-7 left-1/2 flex -translate-x-1/2 lg:hidden"
                  >
                    <ArrowDown className="h-5 w-5 text-[#5B5CE2]/40" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Conclusion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            duration: 0.5,
            delay: 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-14 text-center"
        >
          <p className="inline-flex items-center rounded-full border border-black/[0.06] bg-[#FAFAF8] px-5 py-2.5 text-xs font-medium text-neutral-600 sm:text-sm">
            Tout est clair. Vous savez où vous en êtes.
          </p>
        </motion.div>
      </div>
    </section>
  );
}