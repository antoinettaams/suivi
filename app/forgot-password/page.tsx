"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      toast.error("Veuillez renseigner votre adresse email.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Erreur d'envoi réinitialisation :", error);
        toast.error(`Erreur : ${error.message}`);
        return;
      }

      toast.success(
        "Si un compte existe avec cette adresse, vous recevrez un lien pour réinitialiser votre mot de passe.",
        { duration: 6000 }
      );
    } catch (err) {
      console.error(err);
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#FAFAF8] px-4 py-12 sm:px-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5B5CE2]/[0.08] blur-3xl sm:h-[500px] sm:w-[700px]" />

      {/* Back */}
      <Link
        href="/login"
        className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950 sm:left-8 sm:top-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-[-0.05em] text-neutral-950 sm:text-3xl"
          >
            reste<span className="text-[#5B5CE2]">.</span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-xl shadow-black/[0.03] sm:rounded-3xl sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF0FF] text-[#5B5CE2]">
              <Mail className="h-5 w-5" />
            </div>

            <h1 className="text-xl font-extrabold tracking-[-0.03em] text-neutral-950 sm:text-2xl">
              Mot de passe oublié ?
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Entrez votre adresse email et nous vous enverrons un lien pour
              réinitialiser votre mot de passe.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-neutral-800"
              >
                Adresse email
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-black/[0.08] bg-[#FAFAF8] pl-11 pr-4 text-sm text-neutral-950 outline-none transition-all placeholder:text-neutral-400 focus:border-[#5B5CE2]/50 focus:bg-white focus:ring-4 focus:ring-[#5B5CE2]/[0.08]"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#5B5CE2] px-5 text-sm font-bold text-white shadow-lg shadow-[#5B5CE2]/20 transition-all hover:-translate-y-0.5 hover:bg-[#4D4ED0] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "Envoi en cours..." : "Envoyer le lien"}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 border-t border-black/[0.06] pt-5 text-center">
            <Link
              href="/login"
              className="text-sm font-bold text-[#5B5CE2] transition-colors hover:text-[#4D4ED0]"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}