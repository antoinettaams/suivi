"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  MessageCircle,
  TrendingUp,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Plan = "gratuit" | "pro" | "business";

type Account = {
  id: string;
  client_id: string;
  description: string | null;
  total_amount: number;
  status: "pending" | "paid";
  account_date: string;
  due_date: string | null;
  created_at: string;
};

type Payment = {
  id: string;
  account_id: string;
  amount: number;
  payment_date: string;
};

type Client = {
  id: string;
  name: string;
  phone?: string | null;
};

type AccountWithClient = Account & {
  client: Client | null;
  paidAmount: number;
  remaining: number;
  currentStatus: "pending" | "paid";
};

type Period = "today" | "week" | "month" | "year" | "all";

function formatAmount(amount: number) {
  return `${Math.round(amount).toLocaleString("fr-FR")} F`;
}

function formatShortDate(date: string | null) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function getTodayString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekStart(date: Date) {
  const result = new Date(date);

  // On commence toujours à 00:00 pour inclure toute la journée du lundi.
  result.setHours(0, 0, 0, 0);

  const day = result.getDay();

  // Dimanche = 0, lundi = 1, ..., samedi = 6.
  // On revient au lundi de la semaine courante.
  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);

  return result;
}

function isDateInPeriod(dateString: string, period: Period) {
  if (period === "all") {
    return true;
  }

  const date = new Date(`${dateString}T00:00:00`);
  const now = new Date();

  if (period === "today") {
    return dateString === getTodayString();
  }

  if (period === "week") {
    const weekStart = getWeekStart(now);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const dateOnly = new Date(`${dateString}T00:00:00`);

    return dateOnly >= weekStart && dateOnly <= weekEnd;
  }

  if (period === "month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  if (period === "year") {
    return date.getFullYear() === now.getFullYear();
  }

  return true;
}

function getPeriodLabel(period: Period) {
  switch (period) {
    case "today":
      return "Aujourd'hui";

    case "week":
      return "Cette semaine";

    case "month":
      return "Ce mois";

    case "year":
      return "Cette année";

    case "all":
      return "Tout";

    default:
      return "Ce mois";
  }
}

function normalizeBeninPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("229")) {
    return cleaned;
  }

  if (cleaned.length === 8) {
    return `229${cleaned}`;
  }

  return cleaned;
}

function getDaysDifference(dateString: string) {
  const today = new Date(`${getTodayString()}T00:00:00`);
  const date = new Date(`${dateString}T00:00:00`);

  return Math.round(
    (date.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export default function StatisticsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [period, setPeriod] = useState<Period>("month");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plan, setPlan] = useState<Plan>("gratuit");

  const [loading, setLoading] = useState(true);

  const loadStatistics = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setAccounts([]);
        setPayments([]);
        setClients([]);
        setPlan("gratuit");
        return;
      }

      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select("plan, status")
          .eq("user_id", user.id)
          .maybeSingle();

      if (subscriptionError) {
        console.error(
          "Erreur chargement abonnement :",
          subscriptionError
        );
      }

      if (
        subscriptionData?.status === "active" &&
        (subscriptionData.plan === "pro" ||
          subscriptionData.plan === "business")
      ) {
        setPlan(subscriptionData.plan);
      } else {
        setPlan("gratuit");
      }

      const { data: accountsData, error: accountsError } =
        await supabase
          .from("accounts")
          .select(
            "id, client_id, description, total_amount, status, account_date, due_date, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

      if (accountsError) {
        console.error(accountsError);

        setAccounts([]);
        setPayments([]);
        setClients([]);

        return;
      }

      const rawAccounts = (accountsData || []) as Account[];

      setAccounts(rawAccounts);

      const clientIds = [
        ...new Set(
          rawAccounts.map((account) => account.client_id)
        ),
      ];

      if (clientIds.length > 0) {
        const { data: clientsData, error: clientsError } =
          await supabase
            .from("clients")
            .select("id, name, phone")
            .in("id", clientIds)
            .eq("user_id", user.id);

        if (clientsError) {
          console.error(clientsError);
          setClients([]);
        } else {
          setClients((clientsData || []) as Client[]);
        }
      } else {
        setClients([]);
      }

      const accountIds = rawAccounts.map(
        (account) => account.id
      );

      if (accountIds.length > 0) {
        const { data: paymentsData, error: paymentsError } =
          await supabase
            .from("payments")
            .select(
              "id, account_id, amount, payment_date"
            )
            .in("account_id", accountIds)
            .eq("user_id", user.id)
            .order("payment_date", {
              ascending: true,
            });

        if (paymentsError) {
          console.error(paymentsError);
          setPayments([]);
        } else {
          setPayments((paymentsData || []) as Payment[]);
        }
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error(error);

      setAccounts([]);
      setPayments([]);
      setClients([]);
      setPlan("gratuit");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const clientsMap = useMemo(() => {
    return new Map(
      clients.map((client) => [client.id, client])
    );
  }, [clients]);

  const paidByAccount = useMemo(() => {
    const map = new Map<string, number>();

    for (const payment of payments) {
      const current =
        map.get(payment.account_id) || 0;

      map.set(
        payment.account_id,
        current + Number(payment.amount)
      );
    }

    return map;
  }, [payments]);

  /*
   * COMMANDES DE LA PÉRIODE
   *
   * La période des commandes est basée sur account_date.
   * Le montant payé d'une commande correspond à tous les
   * paiements reçus pour cette commande, quelle que soit
   * leur date.
   */
  const periodAccounts = useMemo(() => {
    return accounts.filter((account) =>
      isDateInPeriod(account.account_date, period)
    );
  }, [accounts, period]);

  const periodOrders = useMemo(() => {
    return periodAccounts.map((account) => {
      const paidAmount =
        paidByAccount.get(account.id) || 0;

      const totalAmount = Number(
        account.total_amount
      );

      return {
        ...account,
        client:
          clientsMap.get(account.client_id) || null,
        paidAmount,
        remaining: Math.max(
          totalAmount - paidAmount,
          0
        ),
        currentStatus:
          paidAmount >= totalAmount
            ? "paid"
            : "pending",
      } as AccountWithClient;
    });
  }, [
    periodAccounts,
    paidByAccount,
    clientsMap,
  ]);

  /*
   * PAIEMENTS REÇUS PENDANT LA PÉRIODE
   *
   * Cette liste est indépendante des commandes créées
   * pendant la période.
   *
   * Exemple :
   * commande le 20 septembre → 50 000 F
   * paiement le 5 octobre → 30 000 F
   *
   * En octobre :
   * - Commandes = 0 F
   * - Paiements reçus = 30 000 F
   */
  const periodPayments = useMemo(() => {
    return payments.filter((payment) =>
      isDateInPeriod(
        payment.payment_date,
        period
      )
    );
  }, [payments, period]);

  const stats = useMemo(() => {
    /*
     * CA / commandes :
     * uniquement les commandes créées pendant la période.
     */
    const revenue = periodOrders.reduce(
      (sum, order) =>
        sum + Number(order.total_amount),
      0
    );

    /*
     * Encaissements :
     * uniquement les paiements effectivement reçus
     * pendant la période.
     */
    const collected = periodPayments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount),
      0
    );

    /*
     * Reste à encaisser :
     * reste actuel des commandes créées pendant
     * la période.
     *
     * Les paiements effectués plus tard sont donc pris
     * en compte pour connaître le reste actuel.
     */
    const remaining = periodOrders.reduce(
      (sum, order) =>
        sum + order.remaining,
      0
    );

    const paidOrders = periodOrders.filter(
      (order) =>
        order.currentStatus === "paid"
    ).length;

    const pendingOrders = periodOrders.filter(
      (order) =>
        order.currentStatus === "pending"
    ).length;

    const averageOrder =
      periodOrders.length > 0
        ? revenue / periodOrders.length
        : 0;

    const clientIds = new Set(
      periodOrders.map(
        (order) => order.client_id
      )
    );

    return {
      revenue,
      collected,
      remaining,
      totalOrders: periodOrders.length,
      paidOrders,
      pendingOrders,
      averageOrder,
      clients: clientIds.size,
    };
  }, [periodOrders, periodPayments]);

  const dueOrders = useMemo(() => {
    return accounts
      .map((account) => {
        const paidAmount =
          paidByAccount.get(account.id) || 0;

        const totalAmount = Number(
          account.total_amount
        );

        const remaining = Math.max(
          totalAmount - paidAmount,
          0
        );

        return {
          ...account,
          client:
            clientsMap.get(account.client_id) ||
            null,
          paidAmount,
          remaining,
        };
      })
      .filter(
        (account) =>
          account.due_date &&
          account.remaining > 0
      )
      .sort((a, b) =>
        (a.due_date || "").localeCompare(
          b.due_date || ""
        )
      );
  }, [accounts, paidByAccount, clientsMap]);

  const overdueOrders = useMemo(() => {
    return dueOrders.filter((order) => {
      if (!order.due_date) return false;

      return getDaysDifference(order.due_date) < 0;
    });
  }, [dueOrders]);

  const upcomingDueOrders = useMemo(() => {
    return dueOrders.filter((order) => {
      if (!order.due_date) return false;

      return getDaysDifference(order.due_date) >= 0;
    });
  }, [dueOrders]);

  const overdueAmount = useMemo(() => {
    return overdueOrders.reduce(
      (sum, order) =>
        sum + order.remaining,
      0
    );
  }, [overdueOrders]);

  const upcomingAmount = useMemo(() => {
    return upcomingDueOrders.reduce(
      (sum, order) =>
        sum + order.remaining,
      0
    );
  }, [upcomingDueOrders]);

  const monthlyData = useMemo(() => {
    const months: {
      key: string;
      label: string;
      amount: number;
    }[] = [];

    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      const year = date.getFullYear();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      months.push({
        key: `${year}-${month}`,
        label: date.toLocaleDateString(
          "fr-FR",
          {
            month: "short",
          }
        ),
        amount: 0,
      });
    }

    for (const payment of payments) {
      const key =
        payment.payment_date.slice(0, 7);

      const month = months.find(
        (item) => item.key === key
      );

      if (month) {
        month.amount += Number(
          payment.amount
        );
      }
    }

    return months;
  }, [payments]);

  const maxMonthlyAmount = Math.max(
    ...monthlyData.map(
      (item) => item.amount
    ),
    1
  );

  const topClients = useMemo(() => {
    const clientMap = new Map<
      string,
      {
        id: string;
        name: string;
        orders: number;
        amount: number;
      }
    >();

    for (const order of periodOrders) {
      const existing = clientMap.get(
        order.client_id
      );

      if (existing) {
        existing.orders += 1;
        existing.amount += Number(
          order.total_amount
        );
      } else {
        clientMap.set(
          order.client_id,
          {
            id: order.client_id,
            name:
              order.client?.name ||
              "Client inconnu",
            orders: 1,
            amount: Number(
              order.total_amount
            ),
          }
        );
      }
    }

    return Array.from(
      clientMap.values()
    )
      .sort(
        (a, b) => b.amount - a.amount
      )
      .slice(0, 5);
  }, [periodOrders]);

  const recentOrders = useMemo(() => {
    return periodOrders.slice(0, 5);
  }, [periodOrders]);

  /*
   * Taux d'encaissement :
   *
   * On mesure ici la part du montant des commandes
   * de la période qui est actuellement encaissée.
   *
   * Ce n'est volontairement PAS :
   * paiements reçus pendant la période / commandes de la période.
   *
   * Exemple :
   * commande septembre = 50 000 F
   * paiement octobre = 50 000 F
   *
   * La commande de septembre apparaît alors comme
   * entièrement encaissée lorsque son état actuel
   * est consulté.
   */
  const paymentRate =
    stats.revenue > 0
      ? Math.min(
          Math.round(
            ((stats.revenue -
              stats.remaining) /
              stats.revenue) *
              100
          ),
          100
        )
      : 0;

  const sendWhatsAppReminder = (
    order: AccountWithClient
  ) => {
    const phone = order.client?.phone;

    if (!phone) {
      return;
    }

    const normalizedPhone =
      normalizeBeninPhone(phone);

    const clientName =
      order.client?.name ||
      "Bonjour";

    const message = order.due_date
      ? `Bonjour ${clientName}, petit rappel concernant votre commande${
          order.description
            ? ` (${order.description})`
            : ""
        }. Il reste ${formatAmount(
          order.remaining
        )} à régler. L'échéance prévue est le ${formatShortDate(
          order.due_date
        )}. Merci beaucoup.`
      : `Bonjour ${clientName}, petit rappel concernant votre commande${
          order.description
            ? ` (${order.description})`
            : ""
        }. Il reste ${formatAmount(
          order.remaining
        )} à régler. Merci beaucoup.`;

    const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
      message
    )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (loading) {
    return (
      <div className="min-h-full bg-[#FAFAF8]">
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* HEADER SKELETON */}
          <div className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-64 animate-pulse rounded bg-neutral-200" />
              </div>
              <div className="w-full space-y-2 sm:w-auto">
                <div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-neutral-200 sm:w-44" />
              </div>
            </div>
            <div className="mt-3 h-8 w-52 animate-pulse rounded-full bg-neutral-200" />
          </div>

          {/* STATS PRINCIPALES SKELETON */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-black/[0.05] bg-white p-4 sm:p-5"
              >
                <div className="mb-3 h-9 w-9 animate-pulse rounded-xl bg-neutral-200" />
                <div className="mb-2 h-3 w-24 animate-pulse rounded bg-neutral-200" />
                <div className="h-6 w-28 animate-pulse rounded bg-neutral-200" />
              </div>
            ))}
          </div>

          {/* SUIVI DÉTAILLÉ SKELETON */}
          <div className="mb-6">
            <div className="mb-3 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
              <div className="h-3 w-64 animate-pulse rounded bg-neutral-200" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-black/[0.05] bg-white p-4"
                >
                  <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />
                  <div className="mt-3 h-6 w-16 animate-pulse rounded bg-neutral-200" />
                  <div className="mt-2 h-3 w-24 animate-pulse rounded bg-neutral-200" />
                </div>
              ))}
            </div>
          </div>

          {/* ÉCHÉANCES SKELETON */}
          <div className="mb-6 grid gap-5 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-black/[0.05] bg-white p-5 sm:p-6"
              >
                <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
                <div className="mt-2 h-3 w-56 animate-pulse rounded bg-neutral-200" />
                <div className="mt-5 space-y-2">
                  {[1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="flex items-center gap-3 rounded-xl p-3"
                    >
                      <div className="h-9 w-9 animate-pulse rounded-full bg-neutral-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                        <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                      </div>
                      <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* GRAPHIQUE SKELETON */}
          <div className="mb-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-black/[0.05] bg-white p-5 sm:p-6">
              <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
              <div className="mt-2 h-3 w-40 animate-pulse rounded bg-neutral-200" />
              <div className="mt-8 flex h-48 items-end gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="flex h-full flex-1 items-end"
                  >
                    <div
                      className="w-full animate-pulse rounded-t-lg bg-neutral-200"
                      style={{ height: `${20 + item * 10}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/[0.05] bg-white p-5 sm:p-6">
              <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded bg-neutral-200" />
              <div className="mt-8 flex items-center justify-center">
                <div className="h-40 w-40 animate-pulse rounded-full bg-neutral-200" />
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="h-16 animate-pulse rounded-xl bg-neutral-200" />
                <div className="h-16 animate-pulse rounded-xl bg-neutral-200" />
              </div>
            </div>
          </div>

          {/* CLIENTS + COMMANDES SKELETON */}
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-black/[0.05] bg-white p-5 sm:p-6"
              >
                <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                <div className="mt-2 h-3 w-40 animate-pulse rounded bg-neutral-200" />
                <div className="mt-5 space-y-2">
                  {[1, 2, 3, 4].map((row) => (
                    <div
                      key={row}
                      className="flex items-center gap-3 rounded-xl p-2.5"
                    >
                      <div className="h-9 w-9 animate-pulse rounded-full bg-neutral-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-28 animate-pulse rounded bg-neutral-200" />
                        <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
                      </div>
                      <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* RÉSUMÉ SKELETON */}
          <div className="mt-5 rounded-2xl border border-black/[0.05] bg-white p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                  <div className="h-6 w-20 animate-pulse rounded bg-neutral-200" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FAFAF8]">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* HEADER */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-[#5B5CE2]">
                Vue d'ensemble
              </p>

              <h1 className="text-2xl font-bold tracking-[-0.035em] text-neutral-950 sm:text-3xl">
                Statistiques
              </h1>

              <p className="mt-1.5 text-sm text-neutral-500">
                Analysez votre activité et vos
                encaissements.
              </p>
            </div>

            <div className="w-full sm:w-auto">
              <label
                htmlFor="period"
                className="mb-1.5 block text-xs font-semibold text-neutral-500"
              >
                Période
              </label>

              <select
                id="period"
                value={period}
                onChange={(e) =>
                  setPeriod(
                    e.target.value as Period
                  )
                }
                className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-800 outline-none transition focus:border-[#5B5CE2]/40 focus:ring-2 focus:ring-[#5B5CE2]/10 sm:w-44"
              >
                <option value="today">
                  Aujourd'hui
                </option>

                <option value="week">
                  Cette semaine
                </option>

                <option value="month">
                  Ce mois
                </option>

                <option value="year">
                  Cette année
                </option>

                <option value="all">
                  Tout
                </option>
              </select>
            </div>
          </div>

          <div className="mt-3 inline-flex items-center rounded-full bg-[#5B5CE2]/[0.07] px-3 py-1.5 text-xs font-medium text-[#5B5CE2]">
            Période affichée :{" "}
            {getPeriodLabel(period)}
          </div>

          <div className="mt-2 max-w-2xl text-xs leading-5 text-neutral-400">
            Les commandes correspondent aux commandes
            créées pendant la période. Les paiements reçus
            correspondent aux encaissements effectués
            pendant cette période.
          </div>
        </div>

        {/* STATS PRINCIPALES */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/[0.05] bg-white p-4 sm:p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B5CE2]/[0.09]">
              <TrendingUp className="h-4 w-4 text-[#5B5CE2]" />
            </div>

            <p className="text-xs font-medium text-neutral-400">
              Commandes
            </p>

            <p className="mt-1 text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
              {formatAmount(stats.revenue)}
            </p>

            <p className="mt-1 text-[10px] text-neutral-400">
              Montant des commandes créées
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.05] bg-white p-4 sm:p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>

            <p className="text-xs font-medium text-neutral-400">
              Paiements reçus
            </p>

            <p className="mt-1 text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
              {formatAmount(stats.collected)}
            </p>

            <p className="mt-1 text-[10px] text-neutral-400">
              Encaissements de la période
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.05] bg-white p-4 sm:p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
              <CreditCard className="h-4 w-4 text-orange-600" />
            </div>

            <p className="text-xs font-medium text-neutral-400">
              Reste à encaisser
            </p>

            <p className="mt-1 text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
              {formatAmount(stats.remaining)}
            </p>

            <p className="mt-1 text-[10px] text-neutral-400">
              Sur les commandes de la période
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.05] bg-white p-4 sm:p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <Users className="h-4 w-4 text-blue-600" />
            </div>

            <p className="text-xs font-medium text-neutral-400">
              Clients
            </p>

            <p className="mt-1 text-xl font-bold tracking-tight text-neutral-900">
              {stats.clients}
            </p>

            <p className="mt-1 text-[10px] text-neutral-400">
              Avec une commande sur la période
            </p>
          </div>
        </div>

        {/* SUIVI DÉTAILLÉ PRO */}
        {plan !== "gratuit" && (
          <div className="mb-6">
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-900">
                  Suivi détaillé
                </h2>

                <span className="rounded-full bg-[#5B5CE2]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5B5CE2]">
                  {plan}
                </span>
              </div>

              <p className="mt-1 text-xs text-neutral-400">
                Une vue détaillée de vos encaissements et
                de vos échéances.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-black/[0.05] bg-white p-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#5B5CE2]" />

                  <p className="text-xs font-medium text-neutral-400">
                    Échéances à venir
                  </p>
                </div>

                <p className="mt-2 text-xl font-bold text-neutral-900">
                  {upcomingDueOrders.length}
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  {formatAmount(upcomingAmount)} à
                  encaisser
                </p>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />

                  <p className="text-xs font-medium text-red-500">
                    Échéances en retard
                  </p>
                </div>

                <p className="mt-2 text-xl font-bold text-red-700">
                  {overdueOrders.length}
                </p>

                <p className="mt-1 text-xs text-red-500">
                  {formatAmount(overdueAmount)} à
                  récupérer
                </p>
              </div>

              <div className="rounded-2xl border border-black/[0.05] bg-white p-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-orange-500" />

                  <p className="text-xs font-medium text-neutral-400">
                    Taux d'encaissement
                  </p>
                </div>

                <p className="mt-2 text-xl font-bold text-neutral-900">
                  {paymentRate}%
                </p>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-[#5B5CE2] transition-all"
                    style={{
                      width: `${paymentRate}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-[10px] leading-4 text-neutral-400">
                  Part des commandes de la période
                  actuellement encaissée.
                </p>
              </div>

              <div className="rounded-2xl border border-black/[0.05] bg-white p-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />

                  <p className="text-xs font-medium text-neutral-400">
                    Panier moyen
                  </p>
                </div>

                <p className="mt-2 text-xl font-bold text-neutral-900">
                  {formatAmount(
                    Math.round(
                      stats.averageOrder
                    )
                  )}
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  par commande
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ÉCHÉANCES PRO */}
        {plan !== "gratuit" && (
          <div className="mb-6 grid gap-5 lg:grid-cols-2">
            {/* RETARDS */}
            <div className="rounded-2xl border border-red-100 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900">
                    Échéances en retard
                  </h2>

                  <p className="mt-1 text-xs text-neutral-400">
                    Commandes dont la date prévue est
                    dépassée.
                  </p>
                </div>

                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>

              <div className="mt-5 space-y-2">
                {overdueOrders.length === 0 ? (
                  <div className="rounded-xl bg-emerald-50 p-4 text-center">
                    <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" />

                    <p className="mt-2 text-xs font-medium text-emerald-700">
                      Aucune échéance en retard.
                    </p>
                  </div>
                ) : (
                  overdueOrders
                    .slice(0, 5)
                    .map((order) => {
                      const daysLate = Math.abs(
                        getDaysDifference(
                          order.due_date!
                        )
                      );

                      return (
                        <div
                          key={order.id}
                          className="flex items-center gap-3 rounded-xl bg-red-50/60 p-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                            {order.client?.name
                              ?.trim()
                              .charAt(0)
                              .toUpperCase() ||
                              "?"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-neutral-800">
                              {order.client?.name ||
                                "Client inconnu"}
                            </p>

                            <p className="text-[11px] text-red-500">
                              En retard de{" "}
                              {daysLate}{" "}
                              {daysLate > 1
                                ? "jours"
                                : "jour"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-bold text-neutral-800">
                              {formatAmount(
                                order.remaining
                              )}
                            </p>

                            {order.client?.phone ? (
                              <button
                                type="button"
                                onClick={() =>
                                  sendWhatsAppReminder(
                                    order as AccountWithClient
                                  )
                                }
                                className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#5B5CE2] hover:underline"
                              >
                                <MessageCircle className="h-3 w-3" />
                                Relancer
                              </button>
                            ) : (
                              <span className="text-[10px] text-neutral-400">
                                Pas de téléphone
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {overdueOrders.length > 5 && (
                <Link
                  href="/dashboard/payments"
                  className="mt-4 block text-center text-xs font-semibold text-[#5B5CE2] hover:underline"
                >
                  Voir toutes les échéances
                </Link>
              )}
            </div>

            {/* À VENIR */}
            <div className="rounded-2xl border border-black/[0.05] bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900">
                    Prochaines échéances
                  </h2>

                  <p className="mt-1 text-xs text-neutral-400">
                    Les prochains paiements attendus.
                  </p>
                </div>

                <CalendarDays className="h-4 w-4 text-[#5B5CE2]" />
              </div>

              <div className="mt-5 space-y-2">
                {upcomingDueOrders.length === 0 ? (
                  <div className="rounded-xl bg-neutral-50 p-4 text-center text-xs text-neutral-400">
                    Aucune échéance à venir.
                  </div>
                ) : (
                  upcomingDueOrders
                    .slice(0, 5)
                    .map((order) => {
                      const daysLeft =
                        getDaysDifference(
                          order.due_date!
                        );

                      return (
                        <div
                          key={order.id}
                          className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-neutral-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5B5CE2]/10 text-[#5B5CE2]">
                            <CalendarDays className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-neutral-800">
                              {order.client?.name ||
                                "Client inconnu"}
                            </p>

                            <p className="text-[11px] text-neutral-400">
                              {daysLeft === 0
                                ? "Échéance aujourd'hui"
                                : `Échéance le ${formatShortDate(
                                    order.due_date
                                  )}`}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-bold text-neutral-800">
                              {formatAmount(
                                order.remaining
                              )}
                            </p>

                            {daysLeft > 0 && (
                              <p className="text-[10px] text-neutral-400">
                                Dans {daysLeft}{" "}
                                {daysLeft > 1
                                  ? "jours"
                                  : "jour"}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {upcomingDueOrders.length > 5 && (
                <Link
                  href="/dashboard/payments"
                  className="mt-4 block text-center text-xs font-semibold text-[#5B5CE2] hover:underline"
                >
                  Voir toutes les échéances
                </Link>
              )}
            </div>
          </div>
        )}

        {/* GRAPHIQUE + RÉPARTITION */}
        <div className="mb-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          {/* ÉVOLUTION */}
          <div className="rounded-2xl border border-black/[0.05] bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Encaissements
                </h2>

                <p className="mt-1 text-xs text-neutral-400">
                  Évolution des 6 derniers mois
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B5CE2]/[0.08]">
                <BarChart3 className="h-4 w-4 text-[#5B5CE2]" />
              </div>
            </div>

            <div className="mt-8 flex h-48 items-end gap-2 sm:gap-4">
              {monthlyData.map((item) => {
                const height =
                  item.amount > 0
                    ? Math.max(
                        (item.amount /
                          maxMonthlyAmount) *
                          100,
                        8
                      )
                    : 4;

                return (
                  <div
                    key={item.key}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div className="flex h-full w-full items-end">
                      <div
                        className="w-full rounded-t-lg bg-[#5B5CE2]/80 transition-all"
                        style={{
                          height: `${height}%`,
                        }}
                        title={formatAmount(
                          item.amount
                        )}
                      />
                    </div>

                    <span className="text-[10px] font-medium capitalize text-neutral-400">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RÉPARTITION */}
          <div className="rounded-2xl border border-black/[0.05] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-bold text-neutral-900">
              État des commandes
            </h2>

            <p className="mt-1 text-xs text-neutral-400">
              Répartition sur{" "}
              {getPeriodLabel(
                period
              ).toLowerCase()}
            </p>

            <div className="mt-8 flex items-center justify-center">
              <div
                className="relative flex h-40 w-40 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(
                    #10b981 ${
                      stats.totalOrders > 0
                        ? (stats.paidOrders /
                            stats.totalOrders) *
                          100
                        : 0
                    }%,
                    #f59e0b 0
                  )`,
                }}
              >
                <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-white">
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats.totalOrders}
                  </p>

                  <p className="text-[10px] text-neutral-400">
                    commandes
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-[11px] font-medium text-emerald-700">
                  Payées
                </p>

                <p className="mt-1 text-lg font-bold text-emerald-800">
                  {stats.paidOrders}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-[11px] font-medium text-amber-700">
                  En attente
                </p>

                <p className="mt-1 text-lg font-bold text-amber-800">
                  {stats.pendingOrders}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CLIENTS + COMMANDES */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* TOP CLIENTS */}
          <div className="rounded-2xl border border-black/[0.05] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Clients actifs
                </h2>

                <p className="mt-1 text-xs text-neutral-400">
                  Clients avec le plus de commandes
                </p>
              </div>

              <Users className="h-4 w-4 text-neutral-400" />
            </div>

            <div className="mt-5 space-y-2">
              {topClients.length === 0 ? (
                <div className="rounded-xl bg-neutral-50 p-5 text-center text-xs text-neutral-400">
                  Aucun client pour cette période.
                </div>
              ) : (
                topClients.map(
                  (client, index) => (
                    <div
                      key={client.id}
                      className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-neutral-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5B5CE2]/10 text-xs font-bold text-[#5B5CE2]">
                        {client.name
                          .trim()
                          .charAt(0)
                          .toUpperCase() ||
                          "?"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-800">
                          {client.name}
                        </p>

                        <p className="text-[11px] text-neutral-400">
                          {client.orders}{" "}
                          {client.orders > 1
                            ? "commandes"
                            : "commande"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-neutral-800">
                          {formatAmount(
                            client.amount
                          )}
                        </p>

                        <p className="text-[10px] text-neutral-400">
                          #{index + 1}
                        </p>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          {/* DERNIÈRES COMMANDES */}
          <div className="rounded-2xl border border-black/[0.05] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Dernières commandes
                </h2>

                <p className="mt-1 text-xs text-neutral-400">
                  Activité récente
                </p>
              </div>

              <CreditCard className="h-4 w-4 text-neutral-400" />
            </div>

            <div className="mt-5 space-y-2">
              {recentOrders.length === 0 ? (
                <div className="rounded-xl bg-neutral-50 p-5 text-center text-xs text-neutral-400">
                  Aucune commande pour cette période.
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-neutral-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">
                      {order.client?.name
                        ?.trim()
                        .charAt(0)
                        .toUpperCase() ||
                        "?"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-800">
                        {order.client?.name ||
                          "Client inconnu"}
                      </p>

                      <p className="truncate text-[11px] text-neutral-400">
                        {order.description ||
                          "Commande"}{" "}
                        ·{" "}
                        {formatShortDate(
                          order.account_date
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-neutral-800">
                        {formatAmount(
                          order.total_amount
                        )}
                      </p>

                      {order.currentStatus ===
                      "paid" ? (
                        <span className="text-[10px] font-semibold text-emerald-600">
                          Payée
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-600">
                          En attente
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RÉSUMÉ */}
        <div className="mt-5 rounded-2xl border border-black/[0.05] bg-white p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-neutral-400">
                Commandes
              </p>

              <p className="mt-1 text-lg font-bold text-neutral-900">
                {stats.totalOrders}
              </p>
            </div>

            <div>
              <p className="text-xs text-neutral-400">
                Panier moyen
              </p>

              <p className="mt-1 text-lg font-bold text-neutral-900">
                {formatAmount(
                  Math.round(
                    stats.averageOrder
                  )
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-neutral-400">
                Taux de paiement
              </p>

              <p className="mt-1 text-lg font-bold text-neutral-900">
                {paymentRate}%
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}