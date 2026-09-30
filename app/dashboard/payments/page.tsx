"use client";
export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  Search, 
  Clock3, 
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Account = {
  id: string;
  client_id: string;
  description: string | null;
  total_amount: number;
  status: "pending" | "paid";
  account_date: string;
  created_at: string;
};

type Client = {
  id: string;
  name: string;
  phone: string | null;
};

type Payment = {
  id: string;
  account_id: string;
  amount: number;
};

type PaymentRow = Account & {
  client: Client | null;
  paidAmount: number;
  remaining: number;
  currentStatus: "pending" | "paid";
};

type Filter = "all" | "pending" | "paid";

function formatAmount(amount: number) {
  return `${amount.toLocaleString("fr-FR")} F`;
}

function formatDate(date: string) {
  if (!date) return "—";

  const formatted = new Date(`${date}T00:00:00`).toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  return formatted.replace(".", "");
}

// 1. Composant principal contenant toute la logique
function PaymentsContent() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();

  const clientFilterId = searchParams.get("client");

  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const loadPayments = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setRows([]);
        return;
      }

      const { data: accountsData, error: accountsError } =
        await supabase
          .from("accounts")
          .select(
            "id, client_id, description, total_amount, status, account_date, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

      if (accountsError) {
        console.error(accountsError);
        setRows([]);
        return;
      }

      const accounts = (accountsData || []) as Account[];

      if (accounts.length === 0) {
        setRows([]);
        return;
      }

      const clientIds = [
        ...new Set(accounts.map((account) => account.client_id)),
      ];

      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, name, phone")
        .in("id", clientIds)
        .eq("user_id", user.id);

      if (clientsError) {
        console.error(clientsError);
      }

      const clients = (clientsData || []) as Client[];

      const clientsMap = new Map(
        clients.map((client) => [client.id, client])
      );

      const accountIds = accounts.map((account) => account.id);

      const { data: paymentsData, error: paymentsError } =
        await supabase
          .from("payments")
          .select("id, account_id, amount")
          .in("account_id", accountIds)
          .eq("user_id", user.id);

      if (paymentsError) {
        console.error(paymentsError);
      }

      const payments = (paymentsData || []) as Payment[];

      const paidByAccount = new Map<string, number>();

      for (const payment of payments) {
        const current = paidByAccount.get(payment.account_id) || 0;

        paidByAccount.set(
          payment.account_id,
          current + Number(payment.amount)
        );
      }

      const finalRows: PaymentRow[] = accounts.map((account) => {
        const paidAmount = paidByAccount.get(account.id) || 0;

        const totalAmount = Number(account.total_amount);

        const remaining = Math.max(totalAmount - paidAmount, 0);

        const currentStatus =
          paidAmount >= totalAmount ? "paid" : "pending";

        return {
          ...account,
          client: clientsMap.get(account.client_id) || null,
          paidAmount,
          remaining,
          currentStatus,
        };
      });

      setRows(finalRows);
    } catch (error) {
      console.error(error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const selectedClient = useMemo(() => {
    if (!clientFilterId) return null;

    return (
      rows.find((row) => row.client_id === clientFilterId)?.client || null
    );
  }, [rows, clientFilterId]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesClient =
        !clientFilterId || row.client_id === clientFilterId;

      const clientName = row.client?.name?.toLowerCase() || "";
      const description = row.description?.toLowerCase() || "";

      const matchesSearch =
        !normalizedSearch ||
        clientName.includes(normalizedSearch) ||
        description.includes(normalizedSearch);

      const matchesFilter =
        filter === "all" || row.currentStatus === filter;

      return matchesClient && matchesSearch && matchesFilter;
    });
  }, [rows, search, filter, clientFilterId]);

  const stats = useMemo(() => {
    const total = filteredRows.length;

    const pending = filteredRows.filter(
      (row) => row.currentStatus === "pending"
    ).length;

    const paid = filteredRows.filter(
      (row) => row.currentStatus === "paid"
    ).length;

    const remaining = filteredRows.reduce(
      (sum, row) => sum + row.remaining,
      0
    );

    return {
      total,
      pending,
      paid,
      remaining,
    };
  }, [filteredRows]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    filter !== "all" ||
    Boolean(clientFilterId);

  return (
    <div className="min-h-full bg-[#FAFAF8]">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* HEADER */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-[#5B5CE2]">
                Gestion
              </p>

              <h1 className="text-2xl font-bold tracking-[-0.035em] text-neutral-950 sm:text-3xl">
                Paiements
              </h1>

              <p className="mt-1.5 text-sm text-neutral-500">
                Suivez vos commandes, versements et montants restants.
              </p>
            </div>
          </div>
        </div>

        {/* CLIENT FILTER */}
        {clientFilterId && (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#5B5CE2]/10 bg-[#5B5CE2]/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[#5B5CE2]">
                Commandes du client
              </p>

              <p className="mt-0.5 text-sm font-semibold text-neutral-900">
                {selectedClient?.name || "Client sélectionné"}
              </p>
            </div>

            <Link
              href="/dashboard/payments"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              <X className="h-3.5 w-3.5" />
              Toutes les commandes
            </Link>
          </div>
        )}

        {/* STATS */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/[0.05] bg-white p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B5CE2]/[0.09]">
              <CreditCard className="h-4 w-4 text-[#5B5CE2]" />
            </div>

            <p className="text-xs font-medium text-neutral-400">
              Commandes
            </p>

            <p className="mt-1 text-xl font-bold tracking-tight text-neutral-900">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.05] bg-white p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
              <Clock3 className="h-4 w-4 text-amber-600" />
            </div>

            <p className="text-xs font-medium text-neutral-400">
              En attente
            </p>

            <p className="mt-1 text-xl font-bold tracking-tight text-neutral-900">
              {stats.pending}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.05] bg-white p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>

            <p className="text-xs font-medium text-neutral-400">
              Payées
            </p>

            <p className="mt-1 text-xl font-bold tracking-tight text-neutral-900">
              {stats.paid}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.05] bg-white p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
              <CreditCard className="h-4 w-4 text-orange-600" />
            </div>

            <p className="text-xs font-medium text-neutral-400">
              Reste à encaisser
            </p>

            <p className="mt-1 text-lg font-bold tracking-tight text-neutral-900">
              {formatAmount(stats.remaining)}
            </p>
          </div>
        </div>

        {/* SEARCH + FILTERS */}
        <div className="mb-5 rounded-2xl border border-black/[0.05] bg-white p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un client..."
                className="h-10 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-[#5B5CE2]/40 focus:ring-2 focus:ring-[#5B5CE2]/10"
              />
            </div>

            <div className="flex w-full overflow-x-auto rounded-xl bg-neutral-100 p-1 lg:w-auto">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  filter === "all"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Toutes
              </button>

              <button
                type="button"
                onClick={() => setFilter("pending")}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  filter === "pending"
                    ? "bg-white text-amber-700 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                En attente
              </button>

              <button
                type="button"
                onClick={() => setFilter("paid")}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  filter === "paid"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Payées
              </button>
            </div>
          </div>
        </div>

        {/* CONTENU */}
        {loading ? (
          <>
            {/* SKELETON DESKTOP */}
            <div className="hidden overflow-hidden rounded-2xl border border-black/[0.05] bg-white lg:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left">
                      {["Client", "Commande", "Total", "Versé", "Reste", "Statut", "Date"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-4 text-xs font-semibold text-neutral-400"
                        >
                          {h}
                        </th>
                      ))}
                      <th className="w-10 px-5 py-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((item) => (
                      <tr key={item} className="border-b border-neutral-100 last:border-0">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 animate-pulse rounded-full bg-neutral-200" />
                            <div className="space-y-2">
                              <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                              <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-200" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-neutral-200" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SKELETON MOBILE */}
            <div className="space-y-3 lg:hidden">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-black/[0.05] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                        <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                      </div>
                    </div>
                    <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-200" />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-3">
                    {[1, 2, 3].map((col) => (
                      <div key={col} className="space-y-2">
                        <div className="h-3 w-12 animate-pulse rounded bg-neutral-200" />
                        <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />
                    <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : filteredRows.length === 0 ? (
          <div className="flex min-h-[330px] flex-col items-center justify-center rounded-2xl border border-black/[0.05] bg-white px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5B5CE2]/[0.08]">
              {hasActiveFilters ? (
                <Search className="h-5 w-5 text-[#5B5CE2]" />
              ) : (
                <CreditCard className="h-5 w-5 text-[#5B5CE2]" />
              )}
            </div>

            <h2 className="mt-4 text-base font-bold text-neutral-900">
              {clientFilterId
                ? "Aucune commande pour ce client"
                : hasActiveFilters
                  ? "Aucun résultat"
                  : "Aucune commande"}
            </h2>

            <p className="mt-1 max-w-sm text-sm text-neutral-500">
              {clientFilterId
                ? "Ce client n'a aucune commande correspondant aux filtres actuels."
                : hasActiveFilters
                  ? "Aucune commande ne correspond à votre recherche ou à ce filtre."
                  : "Les commandes que vous ajouterez apparaîtront ici."}
            </p>

            {clientFilterId && (
              <Link
                href="/dashboard/payments"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Voir toutes les commandes
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden overflow-hidden rounded-2xl border border-black/[0.05] bg-white lg:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left">
                      <th className="px-5 py-4 text-xs font-semibold text-neutral-400">
                        Client
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold text-neutral-400">
                        Commande
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold text-neutral-400">
                        Total
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold text-neutral-400">
                        Versé
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold text-neutral-400">
                        Reste
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold text-neutral-400">
                        Statut
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold text-neutral-400">
                        Date
                      </th>

                      <th className="w-10 px-5 py-4" />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        className="group border-b border-neutral-100 last:border-0 hover:bg-neutral-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5B5CE2]/10 text-sm font-bold text-[#5B5CE2]">
                              {row.client?.name
                                ?.trim()
                                .charAt(0)
                                .toUpperCase() || "?"}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-neutral-800">
                                {row.client?.name || "Client inconnu"}
                              </p>

                              {row.client?.phone && (
                                <p className="mt-0.5 text-xs text-neutral-400">
                                  {row.client.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="max-w-[220px] px-5 py-4">
                          <p className="truncate text-sm text-neutral-700">
                            {row.description || "Commande"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-neutral-800">
                          {formatAmount(row.total_amount)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-emerald-600">
                          {formatAmount(row.paidAmount)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#5B5CE2]">
                          {formatAmount(row.remaining)}
                        </td>

                        <td className="px-5 py-4">
                          {row.currentStatus === "paid" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Payée
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                              <Clock3 className="h-3.5 w-3.5" />
                              En attente
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-neutral-500">
                          {formatDate(row.account_date)}
                        </td>

                        <td className="px-5 py-4">
                          <Link
                            href={`/dashboard/payments/${row.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 opacity-0 transition group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-800"
                            aria-label={`Voir la commande de ${
                              row.client?.name || "ce client"
                            }`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE */}
            <div className="space-y-3 lg:hidden">
              {filteredRows.map((row) => (
                <Link
                  key={row.id}
                  href={`/dashboard/payments/${row.id}`}
                  className="block rounded-2xl border border-black/[0.05] bg-white p-4 transition active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5B5CE2]/10 text-sm font-bold text-[#5B5CE2]">
                        {row.client?.name
                          ?.trim()
                          .charAt(0)
                          .toUpperCase() || "?"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-neutral-900">
                          {row.client?.name || "Client inconnu"}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-neutral-400">
                          {row.description || "Commande"}
                        </p>
                      </div>
                    </div>

                    {row.currentStatus === "paid" ? (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                        Payée
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                        En attente
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-3">
                    <div>
                      <p className="text-[10px] font-medium text-neutral-400">
                        Total
                      </p>

                      <p className="mt-1 text-xs font-bold text-neutral-800">
                        {formatAmount(row.total_amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-medium text-neutral-400">
                        Versé
                      </p>

                      <p className="mt-1 text-xs font-bold text-emerald-600">
                        {formatAmount(row.paidAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-medium text-neutral-400">
                        Reste
                      </p>

                      <p className="mt-1 text-xs font-bold text-[#5B5CE2]">
                        {formatAmount(row.remaining)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(row.account_date)}
                    </span>

                    <span className="flex items-center gap-1 font-medium text-neutral-500">
                      Voir le détail
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// 2. Exportation par défaut enveloppée dans un Suspense
export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
          <Loader2 className="h-8 w-8 animate-spin text-[#5B5CE2]" />
        </div>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}