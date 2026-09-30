"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Loader2,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import AddPaymentDialog from "@/components/dashboard/add-payment-dialog";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

type Account = {
  id: string;
  client_id: string;
  total_amount: number;
  status: "pending" | "paid";
  account_date: string;
};

type Payment = {
  id: string;
  account_id: string;
  amount: number;
};

type ClientSummary = Client & {
  ordersCount: number;
  totalAmount: number;
  totalPaid: number;
  remaining: number;
};

function formatAmount(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} F`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function ClientsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");

  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedClient, setSelectedClient] =
    useState<ClientSummary | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Utilisateur non connecté.");
      }

      const [clientsResult, accountsResult, paymentsResult] =
        await Promise.all([
          supabase
            .from("clients")
            .select("id, name, phone, created_at, updated_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("accounts")
            .select("id, client_id, total_amount, status, account_date")
            .eq("user_id", user.id),

          supabase
            .from("payments")
            .select("id, account_id, amount")
            .eq("user_id", user.id),
        ]);

      if (clientsResult.error) throw clientsResult.error;
      if (accountsResult.error) throw accountsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      setClients(clientsResult.data || []);
      setAccounts(accountsResult.data || []);
      setPayments(paymentsResult.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les clients."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => setSuccess(""), 3000);

    return () => clearTimeout(timer);
  }, [success]);

  const clientSummaries = useMemo<ClientSummary[]>(() => {
    const paymentMap = new Map<string, number>();

    payments.forEach((payment) => {
      paymentMap.set(
        payment.account_id,
        (paymentMap.get(payment.account_id) || 0) + Number(payment.amount)
      );
    });

    const clientAccountMap = new Map<
      string,
      { count: number; total: number; paid: number }
    >();

    accounts.forEach((account) => {
      const paidForAccount = paymentMap.get(account.id) || 0;

      const current = clientAccountMap.get(account.client_id) || {
        count: 0,
        total: 0,
        paid: 0,
      };

      clientAccountMap.set(account.client_id, {
        count: current.count + 1,
        total: current.total + Number(account.total_amount),
        paid: current.paid + paidForAccount,
      });
    });

    return clients.map((client) => {
      const summary = clientAccountMap.get(client.id) || {
        count: 0,
        total: 0,
        paid: 0,
      };

      const remaining = Math.max(summary.total - summary.paid, 0);

      return {
        ...client,
        ordersCount: summary.count,
        totalAmount: summary.total,
        totalPaid: summary.paid,
        remaining,
      };
    });
  }, [clients, accounts, payments]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return clientSummaries;

    return clientSummaries.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        (client.phone || "").toLowerCase().includes(query)
    );
  }, [clientSummaries, search]);

  const totalClients = clientSummaries.length;

  const clientsWithBalance = clientSummaries.filter(
    (client) => client.remaining > 0
  ).length;

  const totalOutstanding = clientSummaries.reduce(
    (sum, client) => sum + client.remaining,
    0
  );

  const totalCollected = clientSummaries.reduce(
    (sum, client) => sum + client.totalPaid,
    0
  );

  function resetForm() {
    setName("");
    setPhone("");
    setError("");
  }

  function openEditModal(client: ClientSummary) {
    setSelectedClient(client);
    setName(client.name);
    setPhone(client.phone || "");
    setError("");
    setShowEditModal(true);
  }

  function openDeleteModal(client: ClientSummary) {
    setSelectedClient(client);
    setError("");
    setShowDeleteModal(true);
  }

  function closeModals() {
    if (deleting) return;

    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedClient(null);
    resetForm();
  }

  async function handleEditClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedClient) return;

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setError("Le nom du client est obligatoire.");
      return;
    }

    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Utilisateur non connecté.");
      }

      const { error: updateError } = await supabase
        .from("clients")
        .update({
          name: cleanName,
          phone: cleanPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedClient.id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setShowEditModal(false);
      setSelectedClient(null);
      resetForm();

      await loadData();

      setSuccess("Client modifié avec succès.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier le client."
      );
    }
  }

  async function handleDeleteClient() {
    if (!selectedClient) return;

    if (selectedClient.ordersCount > 0) {
      setError(
        "Ce client possède encore des commandes. Supprimez d'abord ses commandes."
      );
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Utilisateur non connecté.");
      }

      const { error: deleteError } = await supabase
        .from("clients")
        .delete()
        .eq("id", selectedClient.id)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      setShowDeleteModal(false);
      setSelectedClient(null);

      await loadData();

      setSuccess("Client supprimé avec succès.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le client."
      );
    } finally {
      setDeleting(false);
    }
  }

  function ClientAvatar() {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
        <User className="h-4 w-4 text-gray-600" />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[#FAFAF8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Clients
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Tous vos clients au même endroit
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddPaymentDialog(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Ajouter un client
          </button>
        </div>

        {/* NOTIFICATIONS */}
        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />

            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && !showEditModal && !showDeleteModal && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total clients</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {totalClients}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
                <Users className="h-5 w-5 text-gray-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avec solde restant</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {clientsWithBalance}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                <Wallet className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reste à encaisser</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  {formatAmount(totalOutstanding)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                <Wallet className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total encaissé</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  {formatAmount(totalCollected)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* RECHERCHE */}
        <div className="mb-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un client par nom ou téléphone..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>
        </div>

        {/* LISTE */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {loading ? (
            <>
              {/* SKELETON DESKTOP */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/70">
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Client
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Commandes
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                        Total
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                        Payé
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                        Reste
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {[1, 2, 3, 4, 5].map((item) => (
                      <tr
                        key={item}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-neutral-200" />

                            <div className="min-w-0 space-y-2">
                              <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                              <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
                        </td>

                        <td className="px-5 py-4">
                          <div className="ml-auto h-4 w-24 animate-pulse rounded bg-neutral-200" />
                        </td>

                        <td className="px-5 py-4">
                          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-neutral-200" />
                        </td>

                        <td className="px-5 py-4">
                          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-neutral-200" />
                        </td>

                        <td className="px-5 py-4">
                          <div className="ml-auto flex items-center justify-end gap-1">
                            <div className="h-8 w-24 animate-pulse rounded-lg bg-neutral-200" />
                            <div className="h-8 w-8 animate-pulse rounded-lg bg-neutral-200" />
                            <div className="h-8 w-8 animate-pulse rounded-lg bg-neutral-200" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SKELETON MOBILE */}
              <div className="divide-y divide-gray-100 md:hidden">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-neutral-200" />

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                        <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                      </div>

                      <div className="h-8 w-16 animate-pulse rounded-lg bg-neutral-200" />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="h-12 animate-pulse rounded-xl bg-neutral-100" />
                      <div className="h-12 animate-pulse rounded-xl bg-neutral-100" />
                      <div className="h-12 animate-pulse rounded-xl bg-neutral-100" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : filteredClients.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Users className="h-6 w-6 text-gray-500" />
              </div>

              {search ? (
                <>
                  <h3 className="text-base font-semibold text-gray-900">
                    Aucun client trouvé
                  </h3>

                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    Aucun client ne correspond à « {search} ».
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-base font-semibold text-gray-900">
                    Aucun client pour le moment
                  </h3>

                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    Commencez par ajouter votre premier client ou votre
                    première commande.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowAddPaymentDialog(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un client
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* TABLEAU DESKTOP */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/70">
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Client
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Commandes
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                        Total
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                        Payé
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                        Reste
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ClientAvatar />

                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-900">
                                {client.name}
                              </p>

                              {client.phone ? (
                                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                                  <Phone className="h-3 w-3" />
                                  {client.phone}
                                </div>
                              ) : (
                                <p className="mt-1 text-xs text-gray-400">
                                  Aucun téléphone
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-700">
                            {client.ordersCount}{" "}
                            {client.ordersCount > 1
                              ? "commandes"
                              : "commande"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {formatAmount(client.totalAmount)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="text-sm text-green-600">
                            {formatAmount(client.totalPaid)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          {client.remaining > 0 ? (
                            <span className="text-sm font-medium text-orange-600">
                              {formatAmount(client.remaining)}
                            </span>
                          ) : client.ordersCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Réglé
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/dashboard/payments?client=${client.id}`}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                            >
                              Voir commandes
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => openEditModal(client)}
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(client)}
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CARTES MOBILE */}
              <div className="divide-y divide-gray-100 md:hidden">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-4 transition hover:bg-gray-50/50"
                  >
                    {/* CLIENT + ACTIONS */}
                    <div className="flex items-start gap-3">
                      <ClientAvatar />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">
                          {client.name}
                        </p>

                        {client.phone ? (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{client.phone}</span>
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-gray-400">
                            Aucun téléphone
                          </p>
                        )}

                        <p className="mt-1 text-xs text-gray-400">
                          Client depuis le {formatDate(client.created_at)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(client)}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                          aria-label={`Modifier ${client.name}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(client)}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Supprimer ${client.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* RÉSUMÉ FINANCIER */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-gray-50 px-3 py-3">
                        <p className="text-[11px] font-medium text-gray-500">
                          Commandes
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {client.ordersCount}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 px-3 py-3">
                        <p className="text-[11px] font-medium text-gray-500">
                          Total
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                          {formatAmount(client.totalAmount)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 px-3 py-3">
                        <p className="text-[11px] font-medium text-gray-500">
                          Payé
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-green-600">
                          {formatAmount(client.totalPaid)}
                        </p>
                      </div>
                    </div>

                    {/* RESTE */}
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-3">
                      <span className="text-xs font-medium text-gray-500">
                        Reste à encaisser
                      </span>

                      {client.remaining > 0 ? (
                        <span className="text-sm font-semibold text-orange-600">
                          {formatAmount(client.remaining)}
                        </span>
                      ) : client.ordersCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Réglé
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>

                    {/* VOIR COMMANDES */}
                    <Link
                      href={`/dashboard/payments?client=${client.id}`}
                      className="mt-3 flex w-full items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      <span>Voir les commandes</span>

                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <AddPaymentDialog
        open={showAddPaymentDialog}
        onOpenChange={setShowAddPaymentDialog}
        onPaymentAdded={loadData}
      />

      {/* MODALE D'ÉDITION */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Modifier le client
              </h2>

              <button
                type="button"
                onClick={closeModals}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditClient}>
              <div className="space-y-4 px-5 py-5">
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Nom du client
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Téléphone
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Ex. 97 00 00 00"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE SUPPRESSION */}
      {showDeleteModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="px-5 py-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>

              <h2 className="text-lg font-semibold text-gray-900">
                Supprimer ce client ?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Vous êtes sur le point de supprimer{" "}
                <span className="font-medium text-gray-900">
                  {selectedClient.name}
                </span>
                .
              </p>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {selectedClient.ordersCount > 0 && !error && (
                <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />

                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        Suppression impossible
                      </p>

                      <p className="mt-1 text-sm leading-5 text-orange-800">
                        Ce client possède encore des commandes enregistrées.
                        Supprimez d'abord ses commandes associées pour pouvoir
                        le supprimer.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModals}
                disabled={deleting}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={selectedClient.ordersCount > 0 || deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}