"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo"; // Ajustez le chemin d'import si nécessaire

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      toast.error("Veuillez renseigner votre email et votre mot de passe.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast.error("Veuillez confirmer votre adresse email avant de vous connecter.");
        } else if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou mot de passe incorrect.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data?.session) {
        toast.success("Connexion réussie ! Content de vous revoir.");
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("Une erreur inattendue est survenue lors de la connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen min-h-[100dvh] w-full flex-col justify-center overflow-x-hidden bg-[#FAFAF8] px-4 py-12 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5B5CE2]/[0.08] blur-3xl sm:h-[500px] sm:w-[700px]" />

      {/* Bouton Retour */}
      <div className="absolute left-4 top-4 sm:left-8 sm:top-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-[#5B5CE2]/20"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </Link>
      </div>

      <div className="mx-auto w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo officiel */}
          <div className="mb-6 flex flex-col items-center text-center">
            <Link href="/" className="inline-block transition-transform hover:scale-[1.02]">
              <Logo showText={true} />
            </Link>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xl shadow-black/[0.03] sm:rounded-3xl sm:p-8">
            <div className="text-center">
              <h1 className="text-xl font-extrabold tracking-[-0.03em] text-neutral-950 sm:text-2xl">
                Bienvenue à nouveau
              </h1>
              <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                Connectez-vous pour retrouver vos clients et vos paiements.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold text-neutral-800 sm:text-sm"
                >
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 w-full rounded-xl border border-black/[0.08] bg-[#FAFAF8] pl-10 pr-4 text-sm text-neutral-950 outline-none transition-all placeholder:text-neutral-400 focus:border-[#5B5CE2]/50 focus:bg-white focus:ring-4 focus:ring-[#5B5CE2]/[0.08]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-neutral-800 sm:text-sm"
                  >
                    Mot de passe
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#5B5CE2] transition-colors hover:text-[#4D4ED0]"
                  >
                    Mot de passe oublié
                  </Link>
                </div>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 w-full rounded-xl border border-black/[0.08] bg-[#FAFAF8] pl-10 pr-11 text-sm text-neutral-950 outline-none transition-all placeholder:text-neutral-400 focus:border-[#5B5CE2]/50 focus:bg-white focus:ring-4 focus:ring-[#5B5CE2]/[0.08]"
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
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-11 w-full rounded-xl bg-[#5B5CE2] px-5 text-sm font-bold text-white shadow-lg shadow-[#5B5CE2]/20 transition-all hover:bg-[#4D4ED0] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            {/* Register link */}
            <div className="mt-5 border-t border-black/[0.06] pt-4 text-center sm:mt-6 sm:pt-5">
              <p className="text-xs text-neutral-500 sm:text-sm">
                Pas encore de compte ?{" "}
                <Link
                  href="/register"
                  className="font-bold text-[#5B5CE2] transition-colors hover:text-[#4D4ED0]"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-4 px-2 text-center text-xs text-neutral-400">
            En vous connectant, vous retrouvez votre activité là où vous l’avez laissée.
          </p>
        </motion.div>
      </div>
    </main>
  );
}