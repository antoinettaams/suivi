"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  Loader2,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

type ActivityAction =
  | "client_created"
  | "order_created"
  | "payment_received";

type ActivityLog = {
  id: string;
  action: ActivityAction;
  description: string | null;
  client_id: string | null;
  account_id: string | null;
  payment_id: string | null;
  amount: number | null;
  created_at: string;
};

type Client = {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
};

type Account = {
  id: string;
  client_id: string;
  description: string | null;
  total_amount: number;
  status: "pending" | "paid";
  account_date: string;
  created_at: string;
};

type Payment = {
  id: string;
  account_id: string;
  amount: number;
  payment_date: string;
  created_at: string;
};

type HistoryItem = {
  id: string;
  action: ActivityAction;
  description: string | null;
  client_id: string | null;
  account_id: string | null;
  payment_id: string | null;
  amount: number | null;
  created_at: string;
  clientName: string;
};

type FilterType = "all" | ActivityAction;

const formatAmount = (amount: number | null) => {
  if (amount === null || Number.isNaN(amount)) {
    return "";
  }

  return `${new Intl.NumberFormat("fr-FR").format(amount)} F`;
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const formatDateTime = (date: string) => {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export default function HistoryPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [clearedAt, setClearedAt] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [supabase]);

  const loadHistory = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Utilisateur non connecté.");
        setLoading(false);
        return;
      }

      /*
       * ---------------------------------------------------------
       * 1. VÉRIFICATION DE L'ABONNEMENT
       * ---------------------------------------------------------
       *
       * On vérifie d'abord que l'utilisateur possède bien
       * un abonnement Business actif avant de charger les
       * données de l'historique.
       */

      const { data: subscription, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select("plan, status, expires_at")
          .eq("user_id", user.id)
          .maybeSingle();

      if (subscriptionError) {
        console.error(
          "Erreur abonnement historique:",
          subscriptionError
        );

        toast.error(
          "Impossible de vérifier votre abonnement."
        );

        setLoading(false);
        return;
      }

      const isBusiness =
        subscription?.plan === "business" &&
        subscription?.status === "active" &&
        (!subscription?.expires_at ||
          new Date(subscription.expires_at) > new Date());

      if (!isBusiness) {
        toast.error(
          "L'historique complet est disponible avec le plan Business."
        );

        setLoading(false);
        return;
      }

      /*
       * ---------------------------------------------------------
       * 2. CHARGEMENT DES DONNÉES BUSINESS
       * ---------------------------------------------------------
       *
       * Ces requêtes ne sont effectuées qu'après validation
       * de l'abonnement Business actif.
       */

      const [
        settingsResult,
        clientsResult,
        accountsResult,
        paymentsResult,
        logsResult,
      ] = await Promise.all([
        supabase
          .from("history_settings")
          .select("cleared_at")
          .eq("user_id", user.id)
          .maybeSingle(),

        supabase
          .from("clients")
          .select("id, name, phone, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("accounts")
          .select(
            "id, client_id, description, total_amount, status, account_date, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("payments")
          .select(
            "id, account_id, amount, payment_date, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("activity_logs")
          .select(
            "id, action, description, client_id, account_id, payment_id, amount, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (settingsResult.error) {
        console.error(
          "Erreur paramètres historique:",
          settingsResult.error
        );
      }

      if (clientsResult.error) {
        console.error("Erreur clients:", clientsResult.error);
      }

      if (accountsResult.error) {
        console.error("Erreur commandes:", accountsResult.error);
      }

      if (paymentsResult.error) {
        console.error("Erreur paiements:", paymentsResult.error);
      }

      if (logsResult.error) {
        console.error("Erreur logs:", logsResult.error);
      }

      const clientData = clientsResult.data ?? [];
      const accountData = accountsResult.data ?? [];
      const paymentData = paymentsResult.data ?? [];
      const logData = (logsResult.data ?? []) as ActivityLog[];

      setClients(clientData);
      setAccounts(accountData);
      setPayments(paymentData);
      setActivityLogs(logData);

      setClearedAt(
        settingsResult.data?.cleared_at ?? null
      );
    } catch (error) {
      console.error(
        "Erreur chargement historique:",
        error
      );

      toast.error(
        "Impossible de charger l'historique."
      );
    } finally {
      setLoading(false);
    }
  };

  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();

    clients.forEach((client) => {
      map.set(client.id, client);
    });

    return map;
  }, [clients]);

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();

    accounts.forEach((account) => {
      map.set(account.id, account);
    });

    return map;
  }, [accounts]);

  const paymentMap = useMemo(() => {
    const map = new Map<string, Payment>();

    payments.forEach((payment) => {
      map.set(payment.id, payment);
    });

    return map;
  }, [payments]);

  const historyItems = useMemo(() => {
    const items: HistoryItem[] = [];

    const cutoffTime = clearedAt
      ? new Date(clearedAt).getTime()
      : null;

    const isAfterClear = (date: string) => {
      if (!cutoffTime) {
        return true;
      }

      return new Date(date).getTime() > cutoffTime;
    };

    /*
     * ---------------------------------------------------------
     * 1. LOGS RÉELS
     * ---------------------------------------------------------
     */

    activityLogs.forEach((log) => {
      if (!isAfterClear(log.created_at)) {
        return;
      }

      let clientName = "Client inconnu";

      if (log.client_id) {
        clientName =
          clientMap.get(log.client_id)?.name ??
          "Client inconnu";
      }

      if (
        log.action === "payment_received" &&
        log.payment_id
      ) {
        const payment = paymentMap.get(log.payment_id);

        if (payment) {
          const account = accountMap.get(
            payment.account_id
          );

          if (account) {
            const client = clientMap.get(
              account.client_id
            );

            if (client) {
              clientName = client.name;
            }
          }
        }
      }

      if (
        log.action === "order_created" &&
        log.account_id
      ) {
        const account = accountMap.get(log.account_id);

        if (account) {
          const client = clientMap.get(
            account.client_id
          );

          if (client) {
            clientName = client.name;
          }
        }
      }

      items.push({
        id: `log-${log.id}`,
        action: log.action,
        description: log.description,
        client_id: log.client_id,
        account_id: log.account_id,
        payment_id: log.payment_id,
        amount: log.amount,
        created_at: log.created_at,
        clientName,
      });
    });

    /*
     * ---------------------------------------------------------
     * 2. DÉDUPLICATION PAR TYPE D'ACTION
     * ---------------------------------------------------------
     */

    const existingClientIds = new Set<string>();
    const existingAccountIds = new Set<string>();
    const existingPaymentIds = new Set<string>();

    activityLogs.forEach((log) => {
      if (
        log.action === "client_created" &&
        log.client_id
      ) {
        existingClientIds.add(log.client_id);
      }

      if (
        log.action === "order_created" &&
        log.account_id
      ) {
        existingAccountIds.add(log.account_id);
      }

      if (
        log.action === "payment_received" &&
        log.payment_id
      ) {
        existingPaymentIds.add(log.payment_id);
      }
    });

    /*
     * ---------------------------------------------------------
     * 3. ANCIENS CLIENTS
     * ---------------------------------------------------------
     */

    clients.forEach((client) => {
      if (!isAfterClear(client.created_at)) {
        return;
      }

      if (existingClientIds.has(client.id)) {
        return;
      }

      items.push({
        id: `client-${client.id}`,
        action: "client_created",
        description: "Nouveau client ajouté",
        client_id: client.id,
        account_id: null,
        payment_id: null,
        amount: null,
        created_at: client.created_at,
        clientName: client.name,
      });
    });

    /*
     * ---------------------------------------------------------
     * 4. ANCIENNES COMMANDES
     * ---------------------------------------------------------
     */

    accounts.forEach((account) => {
      if (!isAfterClear(account.created_at)) {
        return;
      }

      if (existingAccountIds.has(account.id)) {
        return;
      }

      const client = clientMap.get(account.client_id);

      items.push({
        id: `account-${account.id}`,
        action: "order_created",
        description:
          account.description ||
          "Nouvelle commande",
        client_id: account.client_id,
        account_id: account.id,
        payment_id: null,
        amount: account.total_amount,
        created_at: account.created_at,
        clientName:
          client?.name ?? "Client inconnu",
      });
    });

    /*
     * ---------------------------------------------------------
     * 5. ANCIENS PAIEMENTS
     * ---------------------------------------------------------
     */

    payments.forEach((payment) => {
      if (!isAfterClear(payment.created_at)) {
        return;
      }

      if (existingPaymentIds.has(payment.id)) {
        return;
      }

      const account = accountMap.get(
        payment.account_id
      );

      const client = account
        ? clientMap.get(account.client_id)
        : undefined;

      items.push({
        id: `payment-${payment.id}`,
        action: "payment_received",
        description: "Paiement reçu",
        client_id: account?.client_id ?? null,
        account_id: payment.account_id,
        payment_id: payment.id,
        amount: payment.amount,
        created_at: payment.created_at,
        clientName:
          client?.name ?? "Client inconnu",
      });
    });

    return items.sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );
  }, [
    activityLogs,
    clients,
    accounts,
    payments,
    clientMap,
    accountMap,
    paymentMap,
    clearedAt,
  ]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return historyItems.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        item.action === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return item.clientName
        .toLowerCase()
        .includes(query);
    });
  }, [historyItems, filter, search]);

  const counts = useMemo(() => {
    return {
      all: historyItems.length,

      clients: historyItems.filter(
        (item) =>
          item.action === "client_created"
      ).length,

      orders: historyItems.filter(
        (item) =>
          item.action === "order_created"
      ).length,

      payments: historyItems.filter(
        (item) =>
          item.action === "payment_received"
      ).length,
    };
  }, [historyItems]);

  const getActionLabel = (
    action: ActivityAction
  ) => {
    switch (action) {
      case "client_created":
        return "Client ajouté";

      case "order_created":
        return "Commande créée";

      case "payment_received":
        return "Paiement reçu";
    }
  };

  const getActionIcon = (
    action: ActivityAction
  ) => {
    switch (action) {
      case "client_created":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-[#5B5CE2]">
            <UserPlus className="h-5 w-5" />
          </div>
        );

      case "order_created":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Clock3 className="h-5 w-5" />
          </div>
        );

      case "payment_received":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        );
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Utilisateur non connecté.");
        return;
      }

      const now = new Date().toISOString();

      /*
       * On enregistre la date de vidage.
       * Les anciennes données resteront dans clients/accounts/payments,
       * mais elles ne seront plus reconstruites dans l'historique.
       */

      const { error: settingsError } =
        await supabase
          .from("history_settings")
          .upsert(
            {
              user_id: user.id,
              cleared_at: now,
              updated_at: now,
            },
            {
              onConflict: "user_id",
            }
          );

      if (settingsError) {
        console.error(
          "Erreur sauvegarde vidage historique:",
          settingsError
        );

        toast.error(
          "Impossible de vider l'historique."
        );

        return;
      }

      /*
       * On supprime également les logs existants.
       * Les données clients/commandes/paiements ne sont PAS supprimées.
       */

      const { error: deleteError } =
        await supabase
          .from("activity_logs")
          .delete()
          .eq("user_id", user.id);

      if (deleteError) {
        console.error(
          "Erreur suppression logs:",
          deleteError
        );

        toast.error(
          "L'historique n'a pas pu être complètement vidé."
        );

        return;
      }

      setActivityLogs([]);
      setClearedAt(now);
      setShowClearModal(false);

      toast.success("Historique vidé.");
    } catch (error) {
      console.error(
        "Erreur vidage historique:",
        error
      );

      toast.error(
        "Une erreur est survenue."
      );
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#5B5CE2]" />

          <p className="text-sm text-gray-500">
            Chargement de l'historique...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FC]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Historique
                </h1>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Retrouvez les principales activités de votre entreprise.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowClearModal(true)
            }
            disabled={historyItems.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Vider l'historique
          </button>
        </div>

        {/* STATS */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-xl border bg-white p-4 text-left transition ${
              filter === "all"
                ? "border-[#5B5CE2] ring-1 ring-[#5B5CE2]"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Toutes
              </span>

              <History className="h-4 w-4 text-gray-400" />
            </div>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {counts.all}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("client_created")
            }
            className={`rounded-xl border bg-white p-4 text-left transition ${
              filter === "client_created"
                ? "border-[#5B5CE2] ring-1 ring-[#5B5CE2]"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Clients
              </span>

              <UserPlus className="h-4 w-4 text-[#5B5CE2]" />
            </div>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {counts.clients}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("order_created")
            }
            className={`rounded-xl border bg-white p-4 text-left transition ${
              filter === "order_created"
                ? "border-[#5B5CE2] ring-1 ring-[#5B5CE2]"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Commandes
              </span>

              <Clock3 className="h-4 w-4 text-blue-500" />
            </div>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {counts.orders}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("payment_received")
            }
            className={`rounded-xl border bg-white p-4 text-left transition ${
              filter === "payment_received"
                ? "border-[#5B5CE2] ring-1 ring-[#5B5CE2]"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Paiements
              </span>

              <CreditCard className="h-4 w-4 text-green-500" />
            </div>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {counts.payments}
            </p>
          </button>
        </div>

        {/* FILTERS */}
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                filter === "all"
                  ? "bg-[#5B5CE2] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tout
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("client_created")
              }
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                filter === "client_created"
                  ? "bg-[#5B5CE2] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Clients
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("order_created")
              }
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                filter === "order_created"
                  ? "bg-[#5B5CE2] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Commandes
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("payment_received")
              }
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                filter === "payment_received"
                  ? "bg-[#5B5CE2] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Paiements
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Rechercher un client..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-9 text-sm outline-none transition focus:border-[#5B5CE2] focus:bg-white focus:ring-2 focus:ring-[#5B5CE2]/10"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* HISTORY */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {filteredItems.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <History className="h-6 w-6 text-gray-400" />
              </div>

              <h2 className="text-base font-semibold text-gray-900">
                Aucun élément trouvé
              </h2>

              <p className="mt-1 max-w-md text-sm text-gray-500">
                {search
                  ? "Aucune activité ne correspond à votre recherche."
                  : "Les nouvelles activités de votre entreprise apparaîtront ici."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-gray-50 sm:flex-row sm:items-center"
                >
                  <div className="shrink-0">
                    {getActionIcon(item.action)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-medium text-gray-900">
                        {getActionLabel(item.action)}
                      </p>

                      <span className="text-gray-300">
                        •
                      </span>

                      <p className="text-sm text-gray-600">
                        {item.clientName}
                      </p>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {item.description ||
                        getActionLabel(item.action)}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    {item.amount !== null ? (
                      <p className="font-semibold text-gray-900">
                        {formatAmount(item.amount)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Nouveau client
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {clearedAt &&
          historyItems.length === 0 && (
            <p className="mt-4 text-center text-xs text-gray-400">
              L'historique a été vidé le{" "}
              {formatDate(clearedAt)}.
            </p>
          )}
      </div>

      {/* MODAL CONFIRMATION */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>

                <h2 className="text-lg font-semibold text-gray-900">
                  Vider l'historique ?
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowClearModal(false)
                }
                disabled={clearing}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm leading-6 text-gray-500">
              Cette action supprimera les activités affichées
              dans votre historique.
              <br />
              <br />
              <span className="font-medium text-gray-700">
                Vos clients, commandes et paiements ne seront
                pas supprimés.
              </span>
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowClearModal(false)
                }
                disabled={clearing}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                disabled={clearing}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {clearing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Vider
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}