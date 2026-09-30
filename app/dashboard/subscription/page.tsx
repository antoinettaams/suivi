"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Crown,
  Loader2,
  Sparkles,
  Users,
  CalendarDays,
  CreditCard,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

type Plan = "gratuit" | "pro" | "business";

type Subscription = {
  id: string;
  user_id: string;
  plan: Plan;
  status: "active" | "expired" | "cancelled";
  started_at: string;
  expires_at: string | null;
};

type PlanInfo = {
  name: string;
  price: number;
  limit: number | null;
  description: string;
  features: string[];
};

const plans: Record<Plan, PlanInfo> = {
  gratuit: {
    name: "Gratuit",
    price: 0,
    limit: 10,
    description: "Pour commencer simplement.",
    features: [
      "Jusqu'à 10 clients",
      "Gestion des clients",
      "Suivi des paiements",
      "Calcul des montants restants",
      "Historique des paiements",
    ],
  },

  pro: {
    name: "Pro",
    price: 1000,
    limit: 100,
    description: "Pour développer votre activité.",
    features: [
      "Jusqu'à 100 clients",
      "Tout le plan Gratuit",
      "Rappels de paiement",
      "Suivi des échéances",
      "Suivi plus détaillé",
    ],
  },

  business: {
    name: "Business",
    price: 2000,
    limit: null,
    description: "Pour les activités qui grandissent.",
    features: [
      "Clients illimités",
      "Tout le plan Pro",
      "Export des données",
      "Historique complet",
    ],
  },
};

function formatDate(date: string | null) {
  if (!date) return "Aucune expiration";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR").format(price);
}

export default function SubscriptionPage() {
  const supabase = useMemo(() => createClient(), []);

  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [clientCount, setClientCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [changingPlan, setChangingPlan] =
    useState<Plan | null>(null);

  const loadSubscription = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Erreur récupération utilisateur :",
          userError.message
        );

        toast.error(
          "Impossible de récupérer votre compte."
        );

        return;
      }

      if (!user) {
        toast.error("Utilisateur non connecté.");
        return;
      }

      const {
        data: subscriptionData,
        error: subscriptionError,
      } = await supabase
        .from("subscriptions")
        .select(
          "id, user_id, plan, status, started_at, expires_at"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error(
          "Erreur abonnement :",
          subscriptionError.message
        );

        toast.error(
          "Impossible de récupérer votre abonnement."
        );

        return;
      }

      if (!subscriptionData) {
        toast.error(
          "Aucun abonnement n'est associé à ce compte."
        );

        return;
      }

      const { count, error: clientsError } = await supabase
        .from("clients")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id);

      if (clientsError) {
        console.error(
          "Erreur clients :",
          clientsError.message
        );

        toast.error(
          "Impossible de récupérer vos clients."
        );

        return;
      }

      setSubscription(
        subscriptionData as Subscription
      );

      setClientCount(count || 0);
    } catch (error) {
      console.error(
        "Erreur générale abonnement :",
        error
      );

      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const simulatePlanChange = async (newPlan: Plan) => {
    if (!subscription) {
      toast.error("Aucun abonnement trouvé.");
      return;
    }

    if (newPlan === subscription.plan) {
      toast.info("Vous utilisez déjà cette formule.");
      return;
    }

    setChangingPlan(newPlan);

    try {
      const now = new Date();

      const expiresAt =
        newPlan === "gratuit"
          ? null
          : new Date(
              now.getTime() +
                30 * 24 * 60 * 60 * 1000
            ).toISOString();

      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan: newPlan,
          status: "active",
          started_at: now.toISOString(),
          expires_at: expiresAt,
        })
        .eq("id", subscription.id)
        .eq("user_id", subscription.user_id);

      if (error) {
        console.error(
          "Erreur Supabase changement plan"
        );

        toast.error(
          error.message ||
            "Impossible de modifier la formule."
        );

        return;
      }

      await loadSubscription();

      if (newPlan === "gratuit") {
        toast.success(
          "Vous êtes maintenant sur le plan Gratuit."
        );
      } else {
        toast.success(
          `Le plan ${plans[newPlan].name} est maintenant actif pendant 30 jours.`
        );
      }
    } catch (error) {
      console.error(
        "Erreur inattendue changement plan :",
        error
      );

      toast.error(
        "Une erreur est survenue lors du changement de formule."
      );
    } finally {
      setChangingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-[#FAFAF8] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">
          {/* HEADER SKELETON */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />
                <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-80 animate-pulse rounded bg-neutral-200" />
              </div>

              <div className="hidden h-16 w-48 animate-pulse rounded-2xl bg-neutral-200 sm:block" />
            </div>
          </div>

          {/* CURRENT PLAN SKELETON */}
          <div className="mb-8 rounded-3xl border border-black/[0.06] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-neutral-200" />

                <div className="space-y-2">
                  <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
                  <div className="h-4 w-48 animate-pulse rounded bg-neutral-200" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[500px]">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-[#FAFAF8] p-3.5"
                  >
                    <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
                    <div className="mt-2 h-5 w-24 animate-pulse rounded bg-neutral-200" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-black/[0.06] pt-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
              </div>

              <div className="h-2 animate-pulse rounded-full bg-neutral-200" />
            </div>
          </div>

          {/* PLANS SKELETON */}
          <div className="mb-5 space-y-2">
            <div className="h-5 w-48 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-neutral-200" />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-black/[0.06] bg-white p-6"
              >
                <div className="mb-4 h-11 w-11 animate-pulse rounded-xl bg-neutral-200" />

                <div className="h-6 w-24 animate-pulse rounded bg-neutral-200" />

                <div className="mt-2 h-4 w-40 animate-pulse rounded bg-neutral-200" />

                <div className="mt-5 flex items-end gap-1">
                  <div className="h-8 w-20 animate-pulse rounded bg-neutral-200" />
                  <div className="h-4 w-12 animate-pulse rounded bg-neutral-200" />
                </div>

                <div className="my-6 h-px bg-black/[0.06]" />

                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((row) => (
                    <div
                      key={row}
                      className="flex items-start gap-2.5"
                    >
                      <div className="mt-0.5 h-4 w-4 animate-pulse rounded-full bg-neutral-200" />
                      <div className="h-4 flex-1 animate-pulse rounded bg-neutral-200" />
                    </div>
                  ))}
                </div>

                <div className="mt-7 h-11 w-full animate-pulse rounded-xl bg-neutral-200" />
              </div>
            ))}
          </div>

          {/* INFO SKELETON */}
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-white p-5 sm:flex-row sm:items-center">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-neutral-200" />

            <div className="space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-neutral-200" />
              <div className="h-3 w-72 animate-pulse rounded bg-neutral-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-full bg-[#FAFAF8] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-black/[0.06] bg-white p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5B5CE2]/10">
              <CreditCard className="h-6 w-6 text-[#5B5CE2]" />
            </div>

            <h1 className="mt-5 text-xl font-bold text-neutral-900">
              Aucun abonnement trouvé
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
              Votre compte ne possède pas encore de
              formule d'abonnement.
            </p>

            <button
              onClick={loadSubscription}
              className="mt-6 rounded-xl bg-[#5B5CE2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4d4ed0]"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = plans[subscription.plan];

  const usagePercentage =
    currentPlan.limit === null
      ? 0
      : Math.min(
          (clientCount / currentPlan.limit) * 100,
          100
        );

  const isExpired =
    subscription.status === "expired" ||
    (subscription.expires_at !== null &&
      new Date(subscription.expires_at).getTime() <
        Date.now());

  return (
    <div className="min-h-full bg-[#FAFAF8] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#5B5CE2]">
                Mon abonnement
              </p>

              <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-950 sm:text-3xl">
                Votre formule
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                Gérez votre formule et choisissez les
                fonctionnalités adaptées à votre activité.
              </p>
            </div>

            <div className="hidden rounded-2xl border border-[#5B5CE2]/10 bg-[#5B5CE2]/[0.06] px-4 py-3 sm:block">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#5B5CE2]" />

                <span className="text-sm font-bold text-[#5B5CE2]">
                  Simulation activée
                </span>
              </div>

              <p className="mt-1 text-xs text-neutral-500">
                Aucun paiement réel pour le moment
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#5B5CE2]/10 bg-[#5B5CE2]/[0.05] p-4 sm:hidden">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#5B5CE2]" />

            <div>
              <p className="text-sm font-bold text-[#5B5CE2]">
                Mode simulation
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Les changements de formule sont simulés.
                Aucun paiement réel n'est effectué.
              </p>
            </div>
          </div>
        </div>

        {/* CURRENT PLAN */}
        <section className="mb-8">
          <div className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5B5CE2]/10">
                  <Crown className="h-6 w-6 text-[#5B5CE2]" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-neutral-900">
                      Plan {currentPlan.name}
                    </h2>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        isExpired
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {isExpired ? "Expiré" : "Actif"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-neutral-500">
                    {currentPlan.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[500px]">
                <div className="rounded-2xl bg-[#FAFAF8] p-3.5">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Users className="h-4 w-4" />

                    <span className="text-xs font-medium">
                      Clients
                    </span>
                  </div>

                  <p className="mt-2 text-lg font-bold text-neutral-900">
                    {clientCount}

                    {currentPlan.limit !== null && (
                      <span className="text-sm font-medium text-neutral-400">
                        {" "}
                        / {currentPlan.limit}
                      </span>
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAFAF8] p-3.5">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <CalendarDays className="h-4 w-4" />

                    <span className="text-xs font-medium">
                      Début
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-bold text-neutral-900">
                    {formatDate(
                      subscription.started_at
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAFAF8] p-3.5">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <CalendarDays className="h-4 w-4" />

                    <span className="text-xs font-medium">
                      Expiration
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-bold text-neutral-900">
                    {subscription.expires_at
                      ? formatDate(
                          subscription.expires_at
                        )
                      : "Sans expiration"}
                  </p>
                </div>
              </div>
            </div>

            {currentPlan.limit !== null && (
              <div className="mt-6 border-t border-black/[0.06] pt-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-neutral-600">
                    Utilisation des clients
                  </p>

                  <p className="text-xs font-bold text-neutral-900">
                    {clientCount} / {currentPlan.limit}
                  </p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usagePercentage >= 90
                        ? "bg-red-500"
                        : usagePercentage >= 70
                        ? "bg-orange-400"
                        : "bg-[#5B5CE2]"
                    }`}
                    style={{
                      width: `${usagePercentage}%`,
                    }}
                  />
                </div>

                {clientCount >= currentPlan.limit && (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    Vous avez atteint la limite de
                    clients de votre formule.
                  </p>
                )}
              </div>
            )}

            {currentPlan.limit === null && (
              <div className="mt-5 flex items-center gap-2 border-t border-black/[0.06] pt-5">
                <Check className="h-4 w-4 text-emerald-500" />

                <p className="text-xs font-medium text-neutral-500">
                  Vous bénéficiez d'un nombre illimité
                  de clients.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* PLANS */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-neutral-900">
              Choisir une formule
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Passez à une formule supérieure lorsque
              votre activité grandit.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {(Object.keys(plans) as Plan[]).map(
              (plan) => {
                const info = plans[plan];

                const isCurrent =
                  subscription.plan === plan;

                const isChanging =
                  changingPlan === plan;

                return (
                  <div
                    key={plan}
                    className={`relative flex flex-col rounded-3xl border bg-white p-6 transition-all ${
                      isCurrent
                        ? "border-[#5B5CE2] shadow-[0_8px_30px_rgba(91,92,226,0.08)]"
                        : "border-black/[0.06] hover:-translate-y-0.5 hover:border-black/[0.1] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                    }`}
                  >
                    {plan === "pro" && !isCurrent && (
                      <div className="absolute right-5 top-5 rounded-full bg-[#5B5CE2]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5B5CE2]">
                        Populaire
                      </div>
                    )}

                    {isCurrent && (
                      <div className="absolute right-5 top-5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Votre plan
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#5B5CE2]/10">
                        {plan === "business" ? (
                          <Crown className="h-5 w-5 text-[#5B5CE2]" />
                        ) : plan === "pro" ? (
                          <Sparkles className="h-5 w-5 text-[#5B5CE2]" />
                        ) : (
                          <Users className="h-5 w-5 text-[#5B5CE2]" />
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-neutral-900">
                        {info.name}
                      </h3>

                      <p className="mt-1 min-h-[40px] text-sm leading-5 text-neutral-500">
                        {info.description}
                      </p>

                      <div className="mt-5 flex items-end gap-1">
                        <span className="text-3xl font-extrabold tracking-[-0.04em] text-neutral-950">
                          {formatPrice(info.price)}
                        </span>

                        <span className="mb-1 text-sm font-medium text-neutral-400">
                          F / mois
                        </span>
                      </div>
                    </div>

                    <div className="mb-6 h-px bg-black/[0.06]" />

                    <div className="flex-1">
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-neutral-400">
                        Inclus
                      </p>

                      <ul className="space-y-3">
                        {info.features.map(
                          (feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-2.5"
                            >
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                                <Check className="h-2.5 w-2.5 text-emerald-600" />
                              </span>

                              <span className="text-sm leading-5 text-neutral-600">
                                {feature}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <button
                      type="button"
                      disabled={
                        isCurrent ||
                        changingPlan !== null
                      }
                      onClick={() =>
                        simulatePlanChange(plan)
                      }
                      className={`mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
                        isCurrent
                          ? "cursor-default bg-neutral-100 text-neutral-400"
                          : plan === "pro" ||
                            plan === "business"
                          ? "bg-[#5B5CE2] text-white hover:bg-[#4d4ed0] disabled:cursor-not-allowed disabled:opacity-60"
                          : "border border-black/[0.08] bg-white text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                      }`}
                    >
                      {isChanging ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Activation...
                        </>
                      ) : isCurrent ? (
                        <>
                          <Check className="h-4 w-4" />
                          Plan actuel
                        </>
                      ) : (
                        `Passer à ${info.name}`
                      )}
                    </button>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* INFO */}
        <section className="mt-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-white p-5 sm:flex-row sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
              <Lock className="h-4 w-4 text-neutral-500" />
            </div>

            <div>
              <p className="text-sm font-semibold text-neutral-800">
                Paiements bientôt disponibles
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Pour le moment, les changements de
                formule sont simulés. L'intégration du
                paiement réel sera ajoutée ultérieurement.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}