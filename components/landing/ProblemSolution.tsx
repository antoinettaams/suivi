"use client";

import { motion } from "framer-motion";
import {
  Calculator,
  MessageCircle,
  NotebookPen,
  ArrowRight,
  Check,
} from "lucide-react";

const problems = [
  {
    icon: MessageCircle,
    title: "Les paiements sont dans WhatsApp",
    description:
      "Un acompte ici, un autre paiement là… et il devient difficile de retrouver l’historique.",
  },
  {
    icon: NotebookPen,
    title: "Les notes s’accumulent",
    description:
      "Carnet, bloc-notes, captures d’écran… les informations sont dispersées.",
  },
  {
    icon: Calculator,
    title: "Les calculs deviennent pénibles",
    description:
      "Montant total, acomptes déjà versés, reste à payer : vous devez tout recalculer.",
  },
];

const solutions = [
  "Chaque client a son propre suivi",
  "Les paiements partiels sont enregistrés",
  "Le reste à payer est calculé automatiquement",
  "Vous retrouvez rapidement ce qu’on vous doit",
];

export function ProblemSolution() {
  return (
    <section className="relative overflow-hidden bg-[#FAFAF8] py-24 lg:py-32">
      <div className="pointer-events-none absolute -right-40 top-20 h-80 w-80 rounded-full bg-[#5B5CE2]/[0.06] blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="max-w-2xl"
        >
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#5B5CE2]">
            Le vrai problème
          </span>

          <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-[-0.04em] text-neutral-950 sm:text-5xl">
            Vous savez que quelqu’un
            <span className="block text-[#5B5CE2]">
              vous doit encore de l’argent.
            </span>
          </h2>

          <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-500">
            Mais retrouver exactement combien, pourquoi et combien a déjà été
            payé ne devrait pas vous prendre plusieurs minutes.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:items-stretch">
          {/* Problèmes */}
          <div className="grid gap-4">
            {problems.map((problem, index) => {
              const Icon = problem.icon;

              return (
                <motion.div
                  key={problem.title}
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: 0.65,
                    delay: index * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="group rounded-2xl border border-black/[0.06] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-black/[0.1] hover:shadow-lg hover:shadow-black/[0.03]"
                >
                  <div className="flex gap-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                      <Icon className="h-5 w-5 text-neutral-500 transition-colors group-hover:text-[#5B5CE2]" />
                    </div>

                    <div>
                      <h3 className="font-bold tracking-[-0.02em] text-neutral-950">
                        {problem.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-neutral-500">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{
              duration: 0.75,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative overflow-hidden rounded-3xl bg-[#171717] p-8 text-white sm:p-10"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#5B5CE2]/20 blur-3xl" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5B5CE2] shadow-lg shadow-[#5B5CE2]/20">
                <Check className="h-6 w-6 text-white" />
              </div>

              <h3 className="mt-7 max-w-md text-3xl font-extrabold tracking-[-0.035em]">
                Avec reste., tout est au même endroit.
              </h3>

              <p className="mt-4 max-w-lg leading-7 text-neutral-400">
                Enregistrez une commande, ajoutez les paiements au fur et à
                mesure et laissez l’application faire les calculs.
              </p>

              <div className="mt-8 space-y-4">
                {solutions.map((solution, index) => (
                  <motion.div
                    key={solution}
                    initial={{ opacity: 0, x: 15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: 0.35 + index * 0.1,
                    }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5B5CE2]/20">
                      <Check className="h-3 w-3 text-[#8B8CF0]" />
                    </div>

                    <span className="text-sm text-neutral-300">
                      {solution}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-2 text-sm font-semibold text-[#A5A6F5]">
                Moins de recherche. Plus de clarté.
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
