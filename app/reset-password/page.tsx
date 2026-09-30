"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // État pour s'assurer que la session issue du lien e-mail est bien chargée
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Écouter le changement d'état d'authentification lorsque l'utilisateur arrive via le lien d'e-mail
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY" || session) {
          setIsSessionReady(true);
        }
      }
    );

    // Vérifier également si une session est déjà active
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsSessionReady(true);
      } else {
        // Laisser un petit délai pour permettre à Supabase de parser le Hash de l'URL
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            if (currentSession) {
              setIsSessionReady(true);
            } else {
              setSessionError(true);
            }
          });
        }, 1000);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("Erreur lors de la mise à jour du mot de passe :", error);
        toast.error(`Erreur : ${error.message}`);
        return;
      }

      setSuccess(true);
      toast.success("Votre mot de passe a été modifié avec succès.");
    } catch (err) {
      console.error(err);
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="fixed inset-0 flex h-screen w-screen items-center justify-center overflow-hidden bg-[#FAFAF8] px-4 py-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5B5CE2]/[0.08] blur-3xl sm:h-[450px] sm:w-[600px]" />

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
        className="relative my-auto w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-4 text-center sm:mb-6">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-[-0.05em] text-neutral-950 sm:text-3xl"
          >
            reste<span className="text-[#5B5CE2]">.</span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xl shadow-black/[0.03] sm:rounded-3xl sm:p-7">
          {!isSessionReady && !sessionError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#5B5CE2]" />
              <p className="mt-3 text-sm text-neutral-500">
                Vérification du lien de réinitialisation...
              </p>
            </div>
          ) : sessionError && !isSessionReady ? (
            <div className="py-4 text-center">
              <h2 className="text-lg font-bold text-neutral-900">
                Lien invalide ou expiré
              </h2>
              <p className="mt-2 text-xs text-neutral-500 sm:text-sm">
                Le lien de réinitialisation est obsolète ou n&apos;a pas pu être vérifié. Veuillez refaire une demande.
              </p>
              <Link
                href="/forgot-password"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#5B5CE2] px-5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#4D4ED0]"
              >
                Demander un nouveau lien
              </Link>
            </div>
          ) : !success ? (
            <>
              <div className="mb-5 text-center sm:mb-6">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF0FF] text-[#5B5CE2] sm:mb-4 sm:h-12 sm:w-12 sm:rounded-2xl">
                  <LockKeyhole className="h-5 w-5" />
                </div>

                <h1 className="text-lg font-extrabold tracking-[-0.03em] text-neutral-950 sm:text-2xl">
                  Nouveau mot de passe
                </h1>

                <p className="mt-1 text-xs text-neutral-500 sm:mt-2 sm:text-sm sm:leading-6">
                  Choisissez un nouveau mot de passe pour sécuriser votre
                  compte.
                </p>
              </div>

              <form
                onSubmit={handleResetPassword}
                className="space-y-4 sm:space-y-5"
              >
                {/* New password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-xs font-semibold text-neutral-800 sm:mb-2 sm:text-sm"
                  >
                    Nouveau mot de passe
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Votre nouveau mot de passe"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-xl border border-black/[0.08] bg-[#FAFAF8] pl-11 pr-11 text-sm text-neutral-950 outline-none transition-all placeholder:text-neutral-400 focus:border-[#5B5CE2]/50 focus:bg-white focus:ring-4 focus:ring-[#5B5CE2]/[0.08] sm:h-12"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-black/[0.04] hover:text-neutral-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <p className="mt-1 text-[11px] text-neutral-400 sm:text-xs">
                    Minimum 6 caractères.
                  </p>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-xs font-semibold text-neutral-800 sm:mb-2 sm:text-sm"
                  >
                    Confirmer le mot de passe
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword ? "text" : "password"
                      }
                      placeholder="Répétez votre mot de passe"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-black/[0.08] bg-[#FAFAF8] pl-11 pr-11 text-sm text-neutral-950 outline-none transition-all placeholder:text-neutral-400 focus:border-[#5B5CE2]/50 focus:bg-white focus:ring-4 focus:ring-[#5B5CE2]/[0.08] sm:h-12"
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
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-black/[0.04] hover:text-neutral-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-[#5B5CE2] px-5 text-sm font-bold text-white shadow-lg shadow-[#5B5CE2]/20 transition-all hover:-translate-y-0.5 hover:bg-[#4D4ED0] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:h-12"
                >
                  {loading
                    ? "Modification..."
                    : "Modifier mon mot de passe"}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-2 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 sm:h-14 sm:w-14">
                <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>

              <h1 className="text-lg font-extrabold tracking-[-0.03em] text-neutral-950 sm:text-2xl">
                Mot de passe modifié
              </h1>

              <p className="mt-1.5 text-xs text-neutral-500 sm:text-sm sm:leading-6">
                Votre nouveau mot de passe a bien été enregistré.
                Vous pouvez maintenant vous connecter à votre compte.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#5B5CE2] px-6 text-sm font-bold text-white shadow-lg shadow-[#5B5CE2]/20 transition-all hover:bg-[#4D4ED0] sm:h-11"
              >
                Se connecter
              </Link>
            </motion.div>
          )}
        </div>

        <p className="mt-3 px-2 text-center text-[11px] text-neutral-400 sm:mt-4 sm:text-xs">
          Votre sécurité compte. Choisissez un mot de passe que vous
          n&apos;utilisez pas ailleurs.
        </p>
      </motion.div>
    </main>
  );
}