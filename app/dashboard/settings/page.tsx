"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const router = useRouter();

  // Le client Supabase est créé une seule fois pour ce composant.
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savingPassword, setSavingPassword] = useState(false);
  const [confirmPasswordOpen, setConfirmPasswordOpen] = useState(false);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Erreur récupération utilisateur :", error);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email || "");
      setLoading(false);
    }

    loadSettings();
  }, [router, supabase]);

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Veuillez renseigner votre mot de passe actuel.");
      return;
    }

    if (!newPassword) {
      toast.error("Veuillez renseigner votre nouveau mot de passe.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error(
        "Le nouveau mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(
        "Le nouveau mot de passe doit être différent de l'ancien."
      );
      return;
    }

    setConfirmPasswordOpen(true);
  }

  async function confirmPasswordChange() {
    setSavingPassword(true);

    try {
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });

      if (signInError) {
        console.error(signInError);
        toast.error("Votre mot de passe actuel est incorrect.");
        return;
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        console.error(updateError);
        toast.error("Impossible de modifier votre mot de passe.");
        return;
      }

      await supabase.auth.signOut();

      setConfirmPasswordOpen(false);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success(
        "Mot de passe modifié avec succès. Veuillez vous re-connecter."
      );

      router.replace("/login");
    } catch (error) {
      console.error(error);
      toast.error(
        "Une erreur est survenue lors de la modification du mot de passe."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error(error);

        toast.error(
          "Erreur lors de la déconnexion : " + error.message
        );

        setIsLoggingOut(false);
        return;
      }

      toast.success("Vous êtes déconnecté.");

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error(error);

      toast.error(
        "Une erreur est survenue lors de la déconnexion."
      );

      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-full bg-[#FAFAF8]">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-10">
        {/* RETOUR */}
        <div className="mb-6">
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au profil
          </Link>
        </div>

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-[-0.04em] text-neutral-950 sm:text-3xl">
            Paramètres du compte
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Gérez la sécurité et les informations liées à votre compte.
          </p>
        </div>

        {/* COMPTE */}
        <Card className="mb-6 rounded-2xl border-black/[0.06] bg-white shadow-none">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-black/[0.06] pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B5CE2]/[0.09]">
                <UserRound className="h-4 w-4 text-[#5B5CE2]" />
              </div>

              <div>
                <h2 className="text-base font-bold text-neutral-950">
                  Compte
                </h2>

                <p className="text-xs text-neutral-400">
                  Informations de connexion
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-xl border border-black/[0.06] bg-neutral-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-neutral-200" />

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                    <div className="h-4 w-48 animate-pulse rounded bg-neutral-200" />
                  </div>

                  <div className="h-6 w-24 animate-pulse rounded-full bg-neutral-200" />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-black/[0.06] bg-neutral-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                    <Mail className="h-4 w-4 text-neutral-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-neutral-400">
                      Adresse e-mail
                    </p>

                    <p className="mt-0.5 truncate text-sm font-semibold text-neutral-900">
                      {email}
                    </p>
                  </div>

                  <div className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Compte actif
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SÉCURITÉ */}
        <Card className="mb-6 rounded-2xl border-black/[0.06] bg-white shadow-none">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-black/[0.06] pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B5CE2]/[0.09]">
                <ShieldCheck className="h-4 w-4 text-[#5B5CE2]" />
              </div>

              <div>
                <h2 className="text-base font-bold text-neutral-950">
                  Sécurité
                </h2>

                <p className="text-xs text-neutral-400">
                  Protégez l'accès à votre compte.
                </p>
              </div>
            </div>

            <form
              onSubmit={handlePasswordSubmit}
              className="space-y-5"
            >
              {/* MOT DE PASSE ACTUEL */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="currentPassword"
                  className="text-xs font-semibold"
                >
                  Mot de passe actuel
                </Label>

                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    value={currentPassword}
                    onChange={(e) =>
                      setCurrentPassword(e.target.value)
                    }
                    placeholder="Votre mot de passe actuel"
                    autoComplete="current-password"
                    className="h-11 rounded-xl pr-11 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        !showCurrentPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
                    aria-label={
                      showCurrentPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* NOUVEAU MOT DE PASSE */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="newPassword"
                  className="text-xs font-semibold"
                >
                  Nouveau mot de passe
                </Label>

                <div className="relative">
                  <Input
                    id="newPassword"
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    placeholder="Minimum 6 caractères"
                    autoComplete="new-password"
                    className="h-11 rounded-xl pr-11 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        !showNewPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
                    aria-label={
                      showNewPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-neutral-400">
                  Utilisez au moins 6 caractères.
                </p>
              </div>

              {/* CONFIRMATION */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-xs font-semibold"
                >
                  Confirmer le nouveau mot de passe
                </Label>

                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Répétez le nouveau mot de passe"
                    autoComplete="new-password"
                    className="h-11 rounded-xl pr-11 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
                    aria-label={
                      showConfirmPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* INFO */}
              <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
                  <KeyRound className="h-4 w-4 text-neutral-500" />
                </div>

                <p className="text-xs leading-5 text-neutral-500">
                  Votre mot de passe est utilisé uniquement
                  pour sécuriser l'accès à votre compte. Il
                  n'est jamais affiché ni enregistré directement
                  par l'application.
                </p>
              </div>

              {/* BOUTON */}
              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="h-11 rounded-xl bg-[#5B5CE2] px-6 text-sm font-semibold text-white hover:bg-[#4D4ED0]"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Modifier le mot de passe
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ABONNEMENT */}
        <Link
          href="/dashboard/subscription"
          className="mb-6 block"
        >
          <Card className="rounded-2xl border-black/[0.06] bg-white shadow-none transition-all hover:border-[#5B5CE2]/30 hover:shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5B5CE2]/[0.09]">
                <ShieldCheck className="h-5 w-5 text-[#5B5CE2]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900">
                  Gestion de l'abonnement
                </p>

                <p className="text-xs text-neutral-400">
                  Consultez votre formule et votre utilisation.
                </p>
              </div>

              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </CardContent>
          </Card>
        </Link>

        {/* DÉCONNEXION */}
        <Card className="rounded-2xl border-0 shadow-sm transition hover:bg-rose-50/50">
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex w-full items-center justify-between px-6 py-5 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <LogOut className="h-5 w-5 text-red-500" />
                </div>

                <div>
                  <p className="font-medium text-red-600">
                    Se déconnecter
                  </p>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* MODALE MOT DE PASSE */}
      <Dialog
        open={confirmPasswordOpen}
        onOpenChange={(open) => {
          if (!savingPassword) {
            setConfirmPasswordOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Modifier votre mot de passe ?
            </DialogTitle>

            <DialogDescription>
              Votre mot de passe actuel sera remplacé et
              vous serez déconnecté(e) pour vous
              réauthentifier avec votre nouveau mot de passe.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-sm leading-6 text-neutral-600">
              Après confirmation, vous serez redirigé(e)
              immédiatement vers la page de connexion.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={savingPassword}
              onClick={() =>
                setConfirmPasswordOpen(false)
              }
              className="rounded-xl"
            >
              Annuler
            </Button>

            <Button
              type="button"
              disabled={savingPassword}
              onClick={confirmPasswordChange}
              className="rounded-xl bg-[#5B5CE2] text-white hover:bg-[#4D4ED0]"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                "Confirmer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODALE DÉCONNEXION */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* OVERLAY */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                !isLoggingOut &&
                setIsLogoutModalOpen(false)
              }
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* CONTENU */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="relative w-full max-w-sm rounded-2xl border border-black/[0.08] bg-white p-6 shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <LogOut className="h-6 w-6" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-neutral-900">
                  Se déconnecter ?
                </h3>

                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                  Êtes-vous sûr de vouloir vous
                  déconnecter de votre compte ?
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={() =>
                    setIsLogoutModalOpen(false)
                  }
                  className="h-10 flex-1 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-700 disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Patientez...
                    </>
                  ) : (
                    "Se déconnecter"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}