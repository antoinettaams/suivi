"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();

  const [activity, setActivity] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    const trimmedActivity = activity.trim();

    if (!trimmedActivity) {
      toast.error("Veuillez renseigner votre activité.");
      return;
    }

    if (trimmedActivity.length < 2) {
      toast.error("Veuillez renseigner une activité valide.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Votre session a expiré. Veuillez vous reconnecter.");
      router.replace("/login");
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: user.user_metadata?.name ?? "",
        activity: trimmedActivity,
      },
      {
        onConflict: "id",
      }
    );

    if (error) {
      console.error(error);

      toast.error(
        "Impossible d'enregistrer votre activité. Veuillez réessayer."
      );

      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex h-screen w-full items-center justify-center overflow-hidden bg-[#FAFAF8] px-5 py-6 text-[#171717]">
      <div className="mx-auto flex w-full max-w-2xl flex-col justify-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-2xl font-bold tracking-tight">
              reste.
            </span>
          </div>

          <p className="text-sm text-[#737373]">
            Votre suivi de paiements, simplement.
          </p>
        </motion.div>

        {/* Contenu */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] sm:p-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-5 flex justify-center"
          >
          </motion.div>

          {/* Titre */}
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Bienvenue sur reste. 👋
            </h1>

            <p className="mx-auto mt-2.5 max-w-lg text-sm leading-6 text-[#737373] sm:text-base">
              Pour personnaliser légèrement votre espace, dites-nous
              simplement ce que vous faites.
            </p>
          </div>

          {/* Formulaire */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-6"
          >
            <label
              htmlFor="activity"
              className="mb-2 block text-sm font-semibold"
            >
              Quelle est votre activité ?
            </label>

            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#737373]">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>

              <input
                id="activity"
                type="text"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleContinue();
                  }
                }}
                placeholder="Ex. : Je suis couturière"
                maxLength={80}
                className="h-12 w-full rounded-xl border border-black/[0.1] bg-[#FAFAF8] pl-12 pr-12 text-sm outline-none transition placeholder:text-[#A3A3A3] focus:border-[#5B5CE2] focus:bg-white focus:ring-4 focus:ring-[#5B5CE2]/10"
              />

              {activity.trim() && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#16A34A] text-white"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </motion.div>
              )}
            </div>

            <p className="mt-2.5 text-xs leading-5 text-[#737373]">
              Par exemple : coiffeuse, photographe, vendeuse de vêtements,
              pâtissière, décoratrice événementielle...
            </p>
          </motion.div>

          {/* Bouton */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6"
          >
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#5B5CE2] px-6 text-sm font-semibold text-white shadow-[0_8px_25px_rgba(91,92,226,0.2)] transition hover:bg-[#4f50d4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Enregistrement..." : "Continuer"}

              {!loading && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              )}
            </button>
          </motion.div>

          <p className="mt-4 text-center text-xs text-[#737373]">
            Vous pourrez modifier votre activité plus tard dans les
            paramètres.
          </p>
        </motion.div>
      </div>
    </main>
  );
}