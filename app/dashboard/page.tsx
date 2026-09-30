"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  Clock3,
  CreditCard,
  Crown,
  Lock,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import AddPaymentDialog from "@/components/dashboard/add-payment-dialog";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Plan = "gratuit" | "pro" | "business";

type Profile = {
  full_name: string | null;
  activity: string | null;
};

type Subscription = {
  id: string;
  user_id: string;
  plan: Plan;
  status: "active" | "expired" | "cancelled";
  started_at: string;
  expires_at: string | null;
};

type Account = {
  id: string;
  client_id: string;
  description: string | null;
  total_amount: number;
  status: "paid" | "pending";
  account_date: string;
  due_date: string | null;
};

type PaymentRow = {
  id: string;
  account_id: string;
  amount: number;
  payment_date: string;
};

type Payment = {
  id: string;
  client_name: string;
  amount: number;
  description: string | null;
  status: "paid" | "pending";
  payment_date: string;
};

type Reminder = {
  id: string;
  clientName: string;
  description: string | null;
  dueDate: string;
  remaining: number;
  type: "overdue" | "today" | "soon";
};

function formatAmount(amount: number) {
  return amount.toLocaleString("fr-FR");
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDateDifference(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${date}T00:00:00`);
  target.setHours(0, 0, 0, 0);

  const difference = target.getTime() - today.getTime();

  return Math.round(difference / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const router = useRouter();

  // Client Supabase stable
  const supabase = useMemo(() => createClient(), []);

  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [payments, setPayments] = useState<Payment[]>([]);

  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [totalCollected, setTotalCollected] = useState(0);

  const [totalPending, setTotalPending] = useState(0);

  const [clientsCount, setClientsCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      // -------------------------------------------------------
      // 1. UTILISATEUR CONNECTÉ
      // -------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      // -------------------------------------------------------
      // 2. PROFIL
      // -------------------------------------------------------

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("full_name, activity")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Erreur profil :",
          profileError.message
        );

        toast.error(
          "Impossible de récupérer votre profil."
        );
      }

      setProfile(profileData);

      // -------------------------------------------------------
      // 3. ABONNEMENT
      // -------------------------------------------------------

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
          "Aucun abonnement trouvé pour ce compte."
        );

        return;
      }

      const currentSubscription =
        subscriptionData as Subscription;

      setSubscription(currentSubscription);

      // -------------------------------------------------------
      // 4. CLIENTS
      // -------------------------------------------------------

      const {
        data: clientsData,
        error: clientsError,
      } = await supabase
        .from("clients")
        .select("id, name")
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

      setClientsCount(clientsData?.length || 0);

      // -------------------------------------------------------
      // 5. COMMANDES
      // -------------------------------------------------------

      const {
        data: accountsData,
        error: accountsError,
      } = await supabase
        .from("accounts")
        .select(
          "id, client_id, description, total_amount, status, account_date, due_date"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (accountsError) {
        console.error(
          "Erreur commandes :",
          accountsError.message
        );

        toast.error(
          "Impossible de récupérer vos commandes."
        );

        return;
      }

      const accounts =
        (accountsData || []) as Account[];

      // -------------------------------------------------------
      // 6. VERSEMENTS
      // -------------------------------------------------------

      const {
        data: paymentsData,
        error: paymentsError,
      } = await supabase
        .from("payments")
        .select(
          "id, account_id, amount, payment_date"
        )
        .eq("user_id", user.id)
        .order("payment_date", {
          ascending: false,
        });

      if (paymentsError) {
        console.error(
          "Erreur paiements :",
          paymentsError.message
        );

        toast.error(
          "Impossible de récupérer vos versements."
        );

        return;
      }

      const paymentRows =
        (paymentsData || []) as PaymentRow[];

      // -------------------------------------------------------
      // 7. TOTAL ENCAISSÉ
      // -------------------------------------------------------

      const collected =
        paymentRows.reduce(
          (total, payment) =>
            total + Number(payment.amount),
          0
        );

      setTotalCollected(collected);

      // -------------------------------------------------------
      // 8. TOTAL RESTANT
      // -------------------------------------------------------

      const paidByAccount =
        new Map<string, number>();

      paymentRows.forEach((payment) => {
        const current =
          paidByAccount.get(
            payment.account_id
          ) || 0;

        paidByAccount.set(
          payment.account_id,
          current + Number(payment.amount)
        );
      });

      let pendingTotal = 0;

      accounts.forEach((account) => {
        const paid =
          paidByAccount.get(account.id) || 0;

        const remaining = Math.max(
          Number(account.total_amount) - paid,
          0
        );

        pendingTotal += remaining;
      });

      setTotalPending(pendingTotal);

      // -------------------------------------------------------
      // 9. MAP CLIENTS / COMMANDES
      // -------------------------------------------------------

      const clientMap =
        new Map<string, string>();

      (clientsData || []).forEach(
        (client) => {
          clientMap.set(
            client.id,
            client.name
          );
        }
      );

      const accountMap =
        new Map<string, Account>();

      accounts.forEach((account) => {
        accountMap.set(
          account.id,
          account
        );
      });

      // -------------------------------------------------------
      // 10. TRANSACTIONS RÉCENTES
      // -------------------------------------------------------

      const recentPayments: Payment[] =
        paymentRows
          .slice(0, 5)
          .map((payment) => {
            const account =
              accountMap.get(
                payment.account_id
              );

            const accountPaid =
              paidByAccount.get(
                payment.account_id
              ) || 0;

            const accountTotal = account
              ? Number(account.total_amount)
              : 0;

            const accountStatus =
              accountPaid >= accountTotal
                ? "paid"
                : "pending";

            return {
              id: payment.id,
              client_name:
                clientMap.get(
                  account?.client_id || ""
                ) || "Client inconnu",
              amount: Number(
                payment.amount
              ),
              description:
                account?.description ||
                null,
              status: accountStatus,
              payment_date:
                payment.payment_date,
            };
          });

      setPayments(recentPayments);

      // -------------------------------------------------------
      // 11. RAPPELS PRO
      // -------------------------------------------------------

      const isProOrBusiness =
        currentSubscription.plan === "pro" ||
        currentSubscription.plan ===
          "business";

      if (isProOrBusiness) {
        const generatedReminders: Reminder[] =
          [];

        accounts.forEach((account) => {
          if (!account.due_date) return;

          const paid =
            paidByAccount.get(account.id) ||
            0;

          const remaining = Math.max(
            Number(account.total_amount) -
              paid,
            0
          );

          if (remaining <= 0) return;

          const difference =
            getDateDifference(
              account.due_date
            );

          if (
            difference < 0 ||
            difference === 0 ||
            difference <= 7
          ) {
            let type: Reminder["type"];

            if (difference < 0) {
              type = "overdue";
            } else if (difference === 0) {
              type = "today";
            } else {
              type = "soon";
            }

            generatedReminders.push({
              id: account.id,
              clientName:
                clientMap.get(
                  account.client_id
                ) || "Client inconnu",
              description:
                account.description,
              dueDate: account.due_date,
              remaining,
              type,
            });
          }
        });

        generatedReminders.sort(
          (a, b) => {
            const priority = {
              overdue: 0,
              today: 1,
              soon: 2,
            };

            if (
              priority[a.type] !==
              priority[b.type]
            ) {
              return (
                priority[a.type] -
                priority[b.type]
              );
            }

            return (
              new Date(a.dueDate).getTime() -
              new Date(b.dueDate).getTime()
            );
          }
        );

        setReminders(
          generatedReminders.slice(0, 5)
        );
      } else {
        setReminders([]);
      }
    } catch (error) {
      console.error(
        "Erreur dashboard :",
        error
      );

      toast.error(
        "Une erreur est survenue lors du chargement du tableau de bord."
      );
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const userName =
    profile?.full_name?.trim() ||
    "Utilisateur";

  const activity =
    profile?.activity?.trim() || "";

  const currentPlan =
    subscription?.plan || "gratuit";

  const isProOrBusiness =
    currentPlan === "pro" ||
    currentPlan === "business";

  const clientLimit =
    currentPlan === "gratuit"
      ? 10
      : currentPlan === "pro"
      ? 100
      : null;

  const usagePercentage =
    clientLimit === null
      ? 0
      : Math.min(
          (clientsCount / clientLimit) *
            100,
          100
        );

  const overdueCount =
    reminders.filter(
      (item) => item.type === "overdue"
    ).length;

  const dueTodayCount =
    reminders.filter(
      (item) => item.type === "today"
    ).length;

  const upcomingCount =
    reminders.filter(
      (item) => item.type === "soon"
    ).length;

  const hasReminder =
    reminders.length > 0;

  const planLabel =
    currentPlan === "business"
      ? "Business"
      : currentPlan === "pro"
      ? "Pro"
      : "Gratuit";

  const planColor =
    currentPlan === "business"
      ? "text-amber-600 bg-amber-50"
      : currentPlan === "pro"
      ? "text-[#5B5CE2] bg-[#5B5CE2]/10"
      : "text-neutral-600 bg-neutral-100";

  return (
    <div className="min-h-full bg-[#FAFAF8] text-[#171717]">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            {loading ? (
              <>
                <Skeleton className="mb-2 h-7 w-48" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Bonjour, {userName} 👋
                </h1>

                <p className="mt-1 text-sm text-neutral-500">
                  Voici ce qui se passe dans votre activité.
                </p>
              </>
            )}
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            {!loading && (
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${planColor}`}
              >
                {currentPlan ===
                "business" ? (
                  <Crown className="h-3.5 w-3.5" />
                ) : currentPlan ===
                  "pro" ? (
                  <Sparkles className="h-3.5 w-3.5" />
                ) : (
                  <Users className="h-3.5 w-3.5" />
                )}

                Plan {planLabel}
              </div>
            )}

            <Button
              onClick={() =>
                setAddPaymentOpen(true)
              }
              className="rounded-xl bg-[#5B5CE2] px-5 shadow-sm hover:bg-[#4f50d0]"
            >
              + Ajouter une commande
            </Button>
          </div>
        </header>

        {/* =====================================================
            MOBILE ADD BUTTON
        ====================================================== */}

        <div className="mb-5 sm:hidden">
          <Button
            onClick={() =>
              setAddPaymentOpen(true)
            }
            className="w-full rounded-xl bg-[#5B5CE2] hover:bg-[#4f50d0]"
          >
            + Ajouter une commande
          </Button>
        </div>

        {/* =====================================================
            LIMIT CLIENTS
        ====================================================== */}

        {!loading &&
          clientLimit !== null &&
          clientsCount >= clientLimit && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  Limite de clients atteinte
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Votre plan {planLabel} permet{" "}
                  {clientLimit} clients. Passez à une
                  formule supérieure pour continuer à
                  ajouter des clients.
                </p>

                <Button
                  variant="ghost"
                  onClick={() =>
                    router.push(
                      "/dashboard/subscription"
                    )
                  }
                  className="mt-2 h-auto p-0 text-xs font-bold text-amber-800 hover:bg-transparent hover:text-amber-900"
                >
                  Voir les formules →
                </Button>
              </div>
            </div>
          )}

        {/* =====================================================
            STATISTIQUES
        ====================================================== */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {/* TOTAL ENCAISSÉ */}

          <Card className="rounded-2xl border-neutral-200/80 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-500">
                    Total encaissé
                  </p>

                  {loading ? (
                    <Skeleton className="mt-2 h-8 w-32" />
                  ) : (
                    <div className="mt-2 text-2xl font-semibold">
                      {formatAmount(
                        totalCollected
                      )}{" "}
                      F
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
                    <ArrowUpRight className="h-3.5 w-3.5" />

                    {totalCollected > 0
                      ? "Versements enregistrés"
                      : "Aucun paiement pour le moment"}
                  </div>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B5CE2]/10">
                  <Wallet className="h-5 w-5 text-[#5B5CE2]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RESTANT */}

          <Card className="rounded-2xl border-neutral-200/80 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-500">
                    Reste à encaisser
                  </p>

                  {loading ? (
                    <Skeleton className="mt-2 h-8 w-32" />
                  ) : (
                    <div className="mt-2 text-2xl font-semibold">
                      {formatAmount(
                        totalPending
                      )}{" "}
                      F
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
                    <Clock3 className="h-3.5 w-3.5" />

                    {totalPending > 0
                      ? "Montant restant des commandes"
                      : "Aucun montant en attente"}
                  </div>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Clock3 className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CLIENTS */}

          <Card className="rounded-2xl border-neutral-200/80 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-500">
                    Clients
                  </p>

                  {loading ? (
                    <Skeleton className="mt-2 h-8 w-16" />
                  ) : (
                    <div className="mt-2 flex items-baseline gap-1 text-2xl font-semibold">
                      {clientsCount}

                      {clientLimit !==
                        null && (
                        <span className="text-sm font-medium text-neutral-400">
                          / {clientLimit}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
                    <ArrowDownRight className="h-3.5 w-3.5" />

                    {clientsCount > 0
                      ? "Clients enregistrés"
                      : "Aucun client enregistré"}
                  </div>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              {!loading &&
                clientLimit !== null && (
                  <div className="mt-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePercentage >=
                          90
                            ? "bg-red-500"
                            : usagePercentage >=
                              70
                            ? "bg-amber-500"
                            : "bg-[#5B5CE2]"
                        }`}
                        style={{
                          width: `${usagePercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </section>

        {/* =====================================================
            PRO : RAPPELS + ÉCHÉANCES
        ====================================================== */}

        <section className="mt-5">
          {isProOrBusiness ? (
            <Card className="overflow-hidden rounded-2xl border-neutral-200/80 shadow-none">
              <CardHeader className="border-b border-neutral-100">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold">
                        Rappels de paiement
                      </CardTitle>

                      <span className="rounded-full bg-[#5B5CE2]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5B5CE2]">
                        Pro
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-neutral-500">
                      Suivez les commandes dont
                      l'échéance approche ou est dépassée.
                    </p>
                  </div>

                  {hasReminder && (
                    <div className="flex flex-wrap gap-2">
                      {overdueCount > 0 && (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                          {overdueCount} en retard
                        </span>
                      )}

                      {dueTodayCount > 0 && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                          {dueTodayCount} aujourd'hui
                        </span>
                      )}

                      {upcomingCount > 0 && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                          {upcomingCount} bientôt
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-3 p-5">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : reminders.length ===
                  0 ? (
                  <div className="flex min-h-[150px] flex-col items-center justify-center px-5 py-8 text-center">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
                      <Check className="h-5 w-5 text-emerald-600" />
                    </div>

                    <p className="text-sm font-semibold text-neutral-800">
                      Rien à signaler
                    </p>

                    <p className="mt-1 max-w-md text-xs leading-5 text-neutral-500">
                      Aucune commande avec une échéance
                      dépassée ou prévue dans les 7 prochains
                      jours.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {reminders.map(
                      (reminder) => {
                        const isOverdue =
                          reminder.type ===
                          "overdue";

                        const isToday =
                          reminder.type ===
                          "today";

                        return (
                          <button
                            key={
                              reminder.id
                            }
                            type="button"
                            onClick={() =>
                              router.push(
                                `/dashboard/payments/${reminder.id}`
                              )
                            }
                            className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-neutral-50 sm:px-5"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                  isOverdue
                                    ? "bg-red-50"
                                    : isToday
                                    ? "bg-amber-50"
                                    : "bg-blue-50"
                                }`}
                              >
                                <CalendarClock
                                  className={`h-5 w-5 ${
                                    isOverdue
                                      ? "text-red-500"
                                      : isToday
                                      ? "text-amber-500"
                                      : "text-blue-500"
                                  }`}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-neutral-800">
                                  {
                                    reminder.clientName
                                  }
                                </p>

                                <p className="truncate text-xs text-neutral-500">
                                  {reminder.description ||
                                    "Commande"}
                                </p>

                                <p
                                  className={`mt-1 text-[11px] font-medium ${
                                    isOverdue
                                      ? "text-red-500"
                                      : isToday
                                      ? "text-amber-600"
                                      : "text-blue-500"
                                  }`}
                                >
                                  {isOverdue
                                    ? `En retard depuis le ${formatDate(
                                        reminder.dueDate
                                      )}`
                                    : isToday
                                    ? "Échéance aujourd'hui"
                                    : `Échéance le ${formatDate(
                                        reminder.dueDate
                                      )}`}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-sm font-bold text-neutral-900">
                                {formatAmount(
                                  reminder.remaining
                                )}{" "}
                                F
                              </p>

                              <p className="mt-1 text-[11px] text-neutral-400">
                                restant
                              </p>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-neutral-200/80 shadow-none">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5B5CE2]/10">
                      <Lock className="h-5 w-5 text-[#5B5CE2]" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-neutral-900">
                          Rappels et échéances
                        </h3>

                        <span className="rounded-full bg-[#5B5CE2]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5B5CE2]">
                          PRO
                        </span>
                      </div>

                      <p className="mt-1 max-w-xl text-xs leading-5 text-neutral-500">
                        Suivez les dates d'échéance et
                        identifiez rapidement les paiements
                        en retard avec le plan Pro.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      router.push(
                        "/dashboard/subscription"
                      )
                    }
                    className="shrink-0 rounded-xl bg-[#5B5CE2] hover:bg-[#4f50d0]"
                  >
                    Découvrir Pro
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* =====================================================
            CONTENU DU BAS
        ====================================================== */}

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">

          {/* TRANSACTIONS */}

          <Card className="rounded-2xl border-neutral-200/80 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Transactions récentes
              </CardTitle>

              <Button
                variant="ghost"
                className="text-sm text-[#5B5CE2] hover:text-[#4f50d0]"
                onClick={() =>
                  router.push(
                    "/dashboard/payments"
                  )
                }
              >
                Voir tout
              </Button>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : payments.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 px-5 text-center">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
                    <CreditCard className="h-5 w-5 text-neutral-500" />
                  </div>

                  <p className="text-sm font-medium">
                    Aucune transaction
                  </p>

                  <p className="mt-1 max-w-sm text-xs text-neutral-500">
                    Ajoutez votre première commande
                    pour commencer à suivre votre activité.
                  </p>

                  <Button
                    onClick={() =>
                      setAddPaymentOpen(true)
                    }
                    variant="outline"
                    className="mt-4 rounded-xl"
                  >
                    Ajouter une commande
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map(
                    (payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-xl border border-neutral-100 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {
                              payment.client_name
                            }
                          </p>

                          <p className="truncate text-xs text-neutral-500">
                            {payment.description ||
                              "Versement"}
                          </p>

                          <p className="mt-1 text-[11px] text-neutral-400">
                            {new Date(
                              `${payment.payment_date}T00:00:00`
                            ).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>
                        </div>

                        <p className="ml-4 shrink-0 text-sm font-semibold">
                          +{" "}
                          {formatAmount(
                            payment.amount
                          )}{" "}
                          F
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ACTIVITÉ */}

          <Card className="rounded-2xl border-neutral-200/80 shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Votre activité
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="rounded-xl bg-[#5B5CE2]/5 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[#5B5CE2]">
                  Activité
                </p>

                {loading ? (
                  <div className="mt-2">
                    <Skeleton className="h-6 w-40" />
                  </div>
                ) : (
                  <p className="mt-2 text-lg font-semibold">
                    {activity ||
                      "Activité non renseignée"}
                  </p>
                )}

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Reste vous aide à suivre simplement
                  vos paiements, vos clients et l'argent
                  qui entre dans votre activité.
                </p>

                {!loading && (
                  <div className="mt-5 flex items-center justify-between rounded-xl bg-white p-3">
                    <div className="flex items-center gap-2">
                      {currentPlan ===
                      "business" ? (
                        <Crown className="h-4 w-4 text-amber-500" />
                      ) : currentPlan ===
                        "pro" ? (
                        <Sparkles className="h-4 w-4 text-[#5B5CE2]" />
                      ) : (
                        <Users className="h-4 w-4 text-neutral-400" />
                      )}

                      <span className="text-xs font-semibold text-neutral-600">
                        Plan {planLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/dashboard/subscription"
                        )
                      }
                      className="text-xs font-bold text-[#5B5CE2] hover:underline"
                    >
                      Gérer
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="h-6" />
      </div>

      {/* =====================================================
          DIALOG AJOUT COMMANDE
      ====================================================== */}

      <AddPaymentDialog
        open={addPaymentOpen}
        onOpenChange={
          setAddPaymentOpen
        }
        onPaymentAdded={
          loadDashboard
        }
      />
    </div>
  );
}