"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo"; // Import du composant Logo

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Veuillez renseigner votre nom.");
      return;
    }

    if (!email.trim()) {
      toast.error("Veuillez renseigner votre adresse email.");
      return;
    }

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Si Supabase crée directement une session,
    // on envoie l'utilisateur vers le choix de son activité.
    if (data.session) {
      toast.success("Compte créé avec succès ! Redirection en cours...");

      window.location.href = "/onboarding";
      return;
    }

    // Si la confirmation d'email est activée,
    // l'utilisateur doit d'abord confirmer son adresse.
    toast.success(
      "Votre compte a été créé ! Vérifiez votre adresse email pour le confirmer.",
      { duration: 6000 }
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAFAF8] px-6 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#5B5CE2]/[0.06] blur-3xl" />

      {/* Back */}
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950 sm:left-8 sm:top-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative w-full max-w-md"
      >
        {/* Logo officiel */}
        <div className="mb-8 flex justify-center">
          <Link
            href="/"
            className="inline-block transition-transform hover:scale-[1.02]"
          >
            <Logo showText={true} />
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-xl shadow-black/[0.03] sm:p-9">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-[-0.035em] text-neutral-950">
              Créez votre compte
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Commencez à suivre vos paiements simplement.
            </p>
          </div>

          <form onSubmit={handleRegister} className="mt-8 space-y-5">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-neutral-800"
              >
                Votre nom
              </label>

              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Votre nom"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 w-full rounded-xl border border-black/[0.08] bg-[#FAFAF8] pl-11 pr-4 text-sm text-neutral-950 outline-none transition-all placeholder:text-neutral-400 focus:border-[#5B5CE2]/50 focus:bg-white focus:ring-4 focus:ring-[#5B5CE2]/[0.08]"
                />
              </div>
            </div>

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-black/[0.08] bg-[#FAFAF8] pl-11 pr-4 text-sm text-neutral-950 outline-none transition-all placeholder:text-neutral-400 focus:border-[#5B5CE2]/50 focus:bg-white focus:ring-4 focus:ring-[#5B5CE2]/[0.08]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-neutral-800"
              >
                Mot de passe
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Au moins 8 caractères"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-black/[0.08] bg-[#FAFAF8] pl-11 pr-11 text-sm text-neutral-950 outline-none transition-all placeholder:text-neutral-400 focus:border-[#5B5CE2]/50 focus:bg-white focus:ring-4 focus:ring-[#5B5CE2]/[0.08]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-black/[0.04] hover:text-neutral-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-neutral-800"
              >
                Confirmer le mot de passe
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Répétez votre mot de passe"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-black/[0.08] bg-[#FAFAF8] pl-11 pr-11 text-sm text-neutral-950 outline-none transition-all placeholder:text-neutral-400 focus:border-[#5B5CE2]/50 focus:bg-white focus:ring-4 focus:ring-[#5B5CE2]/[0.08]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-black/[0.04] hover:text-neutral-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs leading-5 text-neutral-400">
              En créant votre compte, vous acceptez nos conditions
              d’utilisation et notre politique de confidentialité.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#5B5CE2] px-5 text-sm font-bold text-white shadow-lg shadow-[#5B5CE2]/20 transition-all hover:-translate-y-0.5 hover:bg-[#4D4ED0] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "Création du compte..." : "Créer mon compte"}
            </button>
          </form>

          {/* Login */}
          <div className="mt-7 border-t border-black/[0.06] pt-6 text-center">
            <p className="text-sm text-neutral-500">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/login"
                className="font-bold text-[#5B5CE2] transition-colors hover:text-[#4D4ED0]"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}