"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Clock3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Users,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo"; // Import du composant Logo

type SidebarProps = {
  userName: string;
  userInitial?: string;
  activity?: string | null;
};

type Plan = "gratuit" | "pro" | "business";

const navigation = [
  {
    name: "Accueil",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Paiements",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    name: "Clients",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    name: "Statistiques",
    href: "/dashboard/statistics",
    icon: BarChart3,
  },
  {
    name: "Abonnement",
    href: "/dashboard/subscription",
    icon: Sparkles,
  },
];

export default function Sidebar({
  userName: propUserName,
  userInitial: customInitial,
  activity: propActivity,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [currentName, setCurrentName] =
    useState(propUserName);

  const [currentActivity, setCurrentActivity] =
    useState(propActivity);

  const [isLogoutModalOpen, setIsLogoutModalOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [plan, setPlan] =
    useState<Plan | null>(null);

  const [loadingPlan, setLoadingPlan] =
    useState(true);

  useEffect(() => {
    setCurrentName(propUserName);
    setCurrentActivity(propActivity);
  }, [propUserName, propActivity]);

  useEffect(() => {
    loadPlan();
  }, [supabase]);

  async function loadPlan() {
    setLoadingPlan(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setPlan("gratuit");
        return;
      }

      const {
        data: subscription,
        error,
      } = await supabase
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Erreur lors du chargement de l'abonnement:",
          error
        );

        setPlan("gratuit");
        return;
      }

      if (
        !subscription ||
        subscription.status !== "active"
      ) {
        setPlan("gratuit");
        return;
      }

      if (
        subscription.plan !== "gratuit" &&
        subscription.plan !== "pro" &&
        subscription.plan !== "business"
      ) {
        setPlan("gratuit");
        return;
      }

      /*
       * Un abonnement Pro ou Business expiré
       * revient automatiquement au plan gratuit.
       */
      if (
        subscription.plan !== "gratuit" &&
        subscription.expires_at &&
        new Date(subscription.expires_at) <= new Date()
      ) {
        setPlan("gratuit");
        return;
      }

      setPlan(subscription.plan);
    } catch (error) {
      console.error(
        "Erreur inattendue lors du chargement du plan:",
        error
      );

      setPlan("gratuit");
    } finally {
      setLoadingPlan(false);
    }
  }

  const userInitial =
    customInitial ||
    (currentName?.trim()
      ? currentName
          .trim()
          .charAt(0)
          .toUpperCase()
      : "U");

  const userActivity =
    currentActivity?.trim() ||
    "Activité non renseignée";

  const isProfileActive =
    pathname.startsWith("/dashboard/profile") ||
    pathname.startsWith("/dashboard/settings");

  const isHistoryActive =
    pathname.startsWith("/dashboard/history");

  /*
   * Historique est considéré Business uniquement
   * lorsque le plan a été chargé ET confirmé Business.
   */
  const isBusiness =
    !loadingPlan && plan === "business";

  async function handleLogout() {
    try {
      setIsLoggingOut(true);

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        toast.error(
          "Erreur lors de la déconnexion : " +
            error.message
        );

        setIsLoggingOut(false);
        return;
      }

      toast.success(
        "Vous êtes déconnecté."
      );

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
    <>
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-black/[0.06] bg-white lg:flex">
        {/* LOGO OFFICIEL */}
        <div className="flex h-20 items-center px-7">
          <Link
            href="/dashboard"
            className="transition-transform hover:scale-[1.02]"
          >
            <Logo showText={true} />
          </Link>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-4">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Menu
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(
                      item.href
                    );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#5B5CE2]/[0.09] text-[#5B5CE2]"
                      : "text-neutral-500 hover:bg-black/[0.035] hover:text-neutral-900"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] ${
                      isActive
                        ? "text-[#5B5CE2]"
                        : "text-neutral-400 group-hover:text-neutral-700"
                    }`}
                    strokeWidth={
                      isActive ? 2.2 : 1.8
                    }
                  />

                  {item.name}
                </Link>
              );
            })}

            {/* HISTORIQUE UNIQUEMENT POUR BUSINESS */}
            {!loadingPlan &&
              isBusiness && (
                <Link
                  href="/dashboard/history"
                  className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all ${
                    isHistoryActive
                      ? "bg-[#5B5CE2]/[0.09] text-[#5B5CE2]"
                      : "text-neutral-500 hover:bg-black/[0.035] hover:text-neutral-900"
                  }`}
                >
                  <Clock3
                    className={`h-[18px] w-[18px] ${
                      isHistoryActive
                        ? "text-[#5B5CE2]"
                        : "text-neutral-400 group-hover:text-neutral-700"
                    }`}
                    strokeWidth={
                      isHistoryActive
                        ? 2.2
                        : 1.8
                    }
                  />

                  <span className="flex-1">
                    Historique
                  </span>

                  <span className="rounded-full bg-[#5B5CE2]/[0.09] px-1.5 py-0.5 text-[8px] font-bold text-[#5B5CE2]">
                    BUSINESS
                  </span>
                </Link>
              )}

            {/* DÉCONNEXION */}
            <button
              type="button"
              onClick={() =>
                setIsLogoutModalOpen(true)
              }
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-50"
            >
              <LogOut className="h-[18px] w-[18px] text-rose-500 transition-transform group-hover:-translate-x-0.5" />

              Déconnexion
            </button>
          </div>
        </nav>

        {/* PROFIL */}
        <div className="border-t border-black/[0.06] p-4">
          <Link
            href="/dashboard/profile"
            className={`group flex items-center gap-3 rounded-xl p-2.5 transition-all ${
              isProfileActive
                ? "bg-[#5B5CE2]/[0.09]"
                : "hover:bg-black/[0.035]"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                isProfileActive
                  ? "bg-[#5B5CE2] text-white"
                  : "bg-[#5B5CE2]/10 text-[#5B5CE2]"
              }`}
            >
              {userInitial}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-800">
                {currentName ||
                  "Utilisateur"}
              </p>

              <p className="truncate text-xs text-neutral-400">
                {userActivity}
              </p>
            </div>

            <Settings
              className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:rotate-45"
            />
          </Link>
        </div>
      </aside>

      {/* MODALE DE DÉCONNEXION */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                  Êtes-vous sûr de vouloir
                  vous déconnecter de votre
                  compte ?
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={() =>
                    setIsLogoutModalOpen(
                      false
                    )
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
    </>
  );
}