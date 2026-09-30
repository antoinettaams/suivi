"use client";

import { motion } from "framer-motion";
import {
  Camera,
  CakeSlice,
  Scissors,
  Shirt,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

const audiences = [
  {
    icon: Scissors,
    title: "Coiffeuses & barbiers",
    text: "Un client paie une partie maintenant et le reste plus tard.",
  },
  {
    icon: Shirt,
    title: "Couturières",
    text: "Acompte à la commande, paiement à la livraison : gardez tout l’historique.",
  },
  {
    icon: Camera,
    title: "Photographes",
    text: "Suivez les acomptes et les soldes de chaque prestation.",
  },
  {
    icon: CakeSlice,
    title: "Pâtissiers & traiteurs",
    text: "Commandes personnalisées, acomptes et solde à encaisser.",
  },
  {
    icon: ShoppingBag,
    title: "Vendeurs",
    text: "Gardez une trace des commandes payées en plusieurs fois.",
  },
  {
    icon: Sparkles,
    title: "Prestataires",
    text: "Pour toute activité où vos clients ne paient pas toujours en une fois.",
  },
];

export function Audience() {
  return (
    <section className="relative overflow-hidden bg-white py-14 lg:py-15">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
            Pour qui ?
          </span>

          <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-neutral-950 sm:text-5xl">
            Si vos clients paient
            <span className="block text-[#5B5CE2]">
              en plusieurs fois, c’est pour vous.
            </span>
          </h2>

          <p className="mt-5 text-lg leading-8 text-neutral-500">
            Pas besoin d’avoir une grande entreprise. reste. est pensé pour
            celles et ceux qui veulent simplement savoir où ils en sont.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;

            return (
              <motion.div
                key={audience.title}
                initial={{
                  opacity: 0,
                  y: 45,
                  scale: 0.97,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                viewport={{
                  once: true,
                  amount: 0.2,
                }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group rounded-2xl border border-black/[0.06] bg-[#FAFAF8] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#5B5CE2]/20 hover:bg-white hover:shadow-xl hover:shadow-[#5B5CE2]/[0.06]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF0FF] transition-transform duration-300 group-hover:scale-105">
                  <Icon className="h-5 w-5 text-[#5B5CE2]" />
                </div>

                <h3 className="mt-5 text-lg font-bold tracking-[-0.02em] text-neutral-950">
                  {audience.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {audience.text}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            duration: 0.6,
            delay: 0.2,
          }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-neutral-400">
            Et si votre métier n’est pas dans la liste ?
            <span className="ml-1 font-semibold text-neutral-600">
              Si vous gérez des paiements partiels, reste. peut vous servir.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
