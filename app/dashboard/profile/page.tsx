"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Database,
  Loader2,
  LogOut,
  Save,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { createClient } from "@/lib/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type Plan = "gratuit" | "pro" | "business";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [activity, setActivity] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [isBusiness, setIsBusiness] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setSubscriptionLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      // Récupération du profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, activity")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name ?? "");
        setActivity(profile.activity ?? "");
      }

      // Vérification de l'abonnement
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscription) {
        const isActive =
          subscription.status === "active" &&
          (subscription.expires_at === null ||
            new Date(subscription.expires_at) > new Date());

        setIsBusiness(isActive && subscription.plan === "business");
      } else {
        setIsBusiness(false);
      }

      setSubscriptionLoading(false);
      setLoading(false);
    };

    loadProfile();
  }, [router, supabase]);

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setSaved(false);

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName.trim(),
      activity: activity.trim(),
      updated_at: new Date().toISOString(),
    });

    setSaving(false);

    if (!error) {
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    await supabase.auth.signOut();

    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#F8F8FC]">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Skeleton className="mb-3 h-8 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>

            <div className="space-y-6">
              <Skeleton className="h-56 w-full rounded-2xl" />
              <Skeleton className="h-80 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F8FC]">
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au tableau de bord
            </Link>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Mon profil
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gérez vos informations personnelles et votre compte.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Profil */}
            <Card className="overflow-hidden rounded-2xl border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5B5CE2]/10">
                    <User className="h-7 w-7 text-[#5B5CE2]" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Informations personnelles
                    </h2>
                    <p className="text-sm text-gray-500">
                      Ces informations permettent de personnaliser votre
                      expérience.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulaire */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="fullName">Nom complet</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Votre nom complet"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="activity">Activité</Label>
                    <Input
                      id="activity"
                      value={activity}
                      onChange={(e) => setActivity(e.target.value)}
                      placeholder="Ex : Vente de vêtements"
                      className="mt-2"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <AnimatePresence>
                      {saved && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-sm text-green-600"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Informations enregistrées
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="ml-auto bg-[#5B5CE2] hover:bg-[#4d4ed0]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Préférences & Compte */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="border-b px-6 py-5">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-gray-500" />
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        Préférences & Compte
                      </h2>
                      <p className="text-sm text-gray-500">
                        Gérez votre abonnement et les paramètres de votre
                        compte.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y">
                  {/* Abonnement */}
                  <Link
                    href="/dashboard/subscription"
                    className="flex items-center justify-between px-6 py-5 transition hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                        <Sparkles className="h-5 w-5 text-[#5B5CE2]" />
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">
                          Mon abonnement
                        </p>
                        <p className="text-sm text-gray-500">
                          Consultez et gérez votre formule.
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>

                  {/* Données & Export — Business uniquement */}
                  {!subscriptionLoading && isBusiness && (
                    <Link
                      href="/dashboard/data"
                      className="flex items-center justify-between px-6 py-5 transition hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                          <Database className="h-5 w-5 text-[#5B5CE2]" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              Données & export
                            </p>

                            <span className="rounded-full bg-[#5B5CE2]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5B5CE2]">
                              Business
                            </span>
                          </div>

                          <p className="text-sm text-gray-500">
                            Exportez vos clients, commandes et paiements.
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </Link>
                  )}

                  {/* Paramètres */}
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center justify-between px-6 py-5 transition hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <Settings className="h-5 w-5 text-gray-600" />
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">
                          Paramètres du compte
                        </p>
                        <p className="text-sm text-gray-500">
                          Sécurité et paramètres de connexion.
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Déconnexion */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-0">
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-red-50"
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
        </div>
      </main>

      {/* Modal déconnexion */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => {
              if (!loggingOut) setShowLogoutModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                <LogOut className="h-6 w-6 text-red-500" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                Se déconnecter ?
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Vous devrez vous reconnecter pour accéder à votre tableau de
                bord.
              </p>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={loggingOut}
                  onClick={() => setShowLogoutModal(false)}
                >
                  Annuler
                </Button>

                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  disabled={loggingOut}
                  onClick={handleLogout}
                >
                  {loggingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Déconnexion...
                    </>
                  ) : (
                    "Se déconnecter"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}