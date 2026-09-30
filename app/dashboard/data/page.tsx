"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Loader2,
  Lock,
  Receipt,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

type ExportType = "clients" | "commandes" | "paiements" | "all";
type ExportFormat = "xlsx" | "csv" | "pdf";

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
  due_date: string | null;
};

type Payment = {
  id: string;
  account_id: string;
  amount: number;
  payment_date: string;
};

type ClientExportRow = {
  Nom: string;
  Numéro: string;
  "Date de création": string;
};

type OrderExportRow = {
  Client: string;
  Description: string;
  Montant: string;
  "Montant payé": string;
  "Reste à payer": string;
  Date: string;
  État: string;
};

type PaymentExportRow = {
  Client: string;
  "Montant payé": string;
  "Date du paiement": string;
};

type AllExportRow = {
  Client: string;
  Numéro: string;
  "Date de création": string;
  Commandes: string;
  "Total dû": string;
  "Total payé": string;
  "Reste à payer": string;
  État: string;
};

type ExportData = {
  clients: ClientExportRow[];
  commandes: OrderExportRow[];
  paiements: PaymentExportRow[];
  all: AllExportRow[];
};

const supabase = createClient();

function formatAmount(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(
    Math.round(Number(amount) || 0)
  )} F`;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";

  const cleanDate = String(date).slice(0, 10);
  const parsed = new Date(`${cleanDate}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function escapeCsvValue(value: unknown) {
  const text = String(value ?? "");

  return `"${text.replace(/"/g, '""')}"`;
}

function rowsToCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);

  const lines = [
    headers.map(escapeCsvValue).join(";"),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(";")
    ),
  ];

  return "\uFEFF" + lines.join("\r\n");
}

function downloadBlob(
  content: BlobPart,
  filename: string,
  type: string
) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function getFileDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DataPage() {
  const [loading, setLoading] = useState(true);

  // Format actuellement en cours d'export
  const [exportingFormat, setExportingFormat] =
    useState<ExportFormat | null>(null);

  const [isBusiness, setIsBusiness] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [selectedType, setSelectedType] =
    useState<ExportType | null>(null);

  const [showFormatModal, setShowFormatModal] = useState(false);

  const loadData = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/";
        return;
      }

      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const subscriptionIsActive =
        subscriptionData?.status === "active" &&
        (!subscriptionData.expires_at ||
          new Date(subscriptionData.expires_at) > new Date());

      const business =
        subscriptionData?.plan === "business" &&
        subscriptionIsActive;

      setIsBusiness(business);

      if (!business) {
        setLoading(false);
        return;
      }

      const { data: clientsData, error: clientsError } =
        await supabase
          .from("clients")
          .select("id, name, phone, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

      if (clientsError) {
        console.error(clientsError);
        toast.error("Impossible de charger les clients.");
        return;
      }

      const { data: accountsData, error: accountsError } =
        await supabase
          .from("accounts")
          .select(
            "id, client_id, description, total_amount, status, account_date, due_date"
          )
          .eq("user_id", user.id)
          .order("account_date", { ascending: false });

      if (accountsError) {
        console.error(accountsError);
        toast.error("Impossible de charger les commandes.");
        return;
      }

      const accountIds = (accountsData || []).map(
        (account) => account.id
      );

      let paymentsData: Payment[] = [];

      if (accountIds.length > 0) {
        const { data, error: paymentsError } =
          await supabase
            .from("payments")
            .select(
              "id, account_id, amount, payment_date"
            )
            .in("account_id", accountIds)
            .eq("user_id", user.id)
            .order("payment_date", { ascending: false });

        if (paymentsError) {
          console.error(paymentsError);
          toast.error(
            "Impossible de charger les paiements."
          );
          return;
        }

        paymentsData = (data || []) as Payment[];
      }

      setClients((clientsData || []) as Client[]);
      setAccounts((accountsData || []) as Account[]);
      setPayments(paymentsData);
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportData = useMemo<ExportData>(() => {
    const clientsMap = new Map(
      clients.map((client) => [client.id, client])
    );

    const accountsMap = new Map(
      accounts.map((account) => [account.id, account])
    );

    const paidByAccount = new Map<string, number>();

    for (const payment of payments) {
      const current =
        paidByAccount.get(payment.account_id) || 0;

      paidByAccount.set(
        payment.account_id,
        current + Number(payment.amount || 0)
      );
    }

    // ================================
    // CLIENTS
    // ================================

    const clientsRows: ClientExportRow[] = clients.map(
      (client) => ({
        Nom: client.name || "Client sans nom",
        Numéro: client.phone || "Non renseigné",
        "Date de création": formatDate(client.created_at),
      })
    );

    // ================================
    // COMMANDES
    // ================================

    const commandesRows: OrderExportRow[] =
      accounts.map((account) => {
        const client = clientsMap.get(account.client_id);

        const total = Number(account.total_amount || 0);
        const paid = paidByAccount.get(account.id) || 0;
        const remaining = Math.max(total - paid, 0);

        return {
          Client: client?.name || "Client inconnu",
          Description:
            account.description?.trim() || "Commande",
          Montant: formatAmount(total),
          "Montant payé": formatAmount(paid),
          "Reste à payer": formatAmount(remaining),
          Date: formatDate(account.account_date),
          État: remaining <= 0 ? "Payée" : "En attente",
        };
      });

    // ================================
    // PAIEMENTS
    // ================================

    const paiementsRows: PaymentExportRow[] =
      payments.map((payment) => {
        const account = accountsMap.get(payment.account_id);

        const client = account
          ? clientsMap.get(account.client_id)
          : undefined;

        return {
          Client: client?.name || "Client inconnu",
          "Montant payé": formatAmount(
            Number(payment.amount || 0)
          ),
          "Date du paiement": formatDate(
            payment.payment_date
          ),
        };
      });

    // ================================
    // TOUTES LES DONNÉES
    // ================================

    const allRows: AllExportRow[] = clients.map(
      (client) => {
        const clientAccounts = accounts.filter(
          (account) => account.client_id === client.id
        );

        const clientAccountIds = new Set(
          clientAccounts.map((account) => account.id)
        );

        const clientPayments = payments.filter((payment) =>
          clientAccountIds.has(payment.account_id)
        );

        const totalDue = clientAccounts.reduce(
          (sum, account) =>
            sum + Number(account.total_amount || 0),
          0
        );

        const totalPaid = clientPayments.reduce(
          (sum, payment) =>
            sum + Number(payment.amount || 0),
          0
        );

        const remaining = Math.max(
          totalDue - totalPaid,
          0
        );

        let state = "En attente";

        if (clientAccounts.length === 0) {
          state = "Aucune commande";
        } else if (remaining <= 0) {
          state = "Payé";
        }

        return {
          Client: client.name || "Client sans nom",
          Numéro: client.phone || "Non renseigné",
          "Date de création": formatDate(
            client.created_at
          ),
          Commandes: `${clientAccounts.length} ${
            clientAccounts.length > 1
              ? "commandes"
              : "commande"
          }`,
          "Total dû": formatAmount(totalDue),
          "Total payé": formatAmount(totalPaid),
          "Reste à payer": formatAmount(remaining),
          État: state,
        };
      }
    );

    return {
      clients: clientsRows,
      commandes: commandesRows,
      paiements: paiementsRows,
      all: allRows,
    };
  }, [clients, accounts, payments]);

  const getRowsForType = (type: ExportType) => {
    if (type === "clients") {
      return exportData.clients;
    }

    if (type === "commandes") {
      return exportData.commandes;
    }

    if (type === "paiements") {
      return exportData.paiements;
    }

    return exportData.all;
  };

  const getExportTitle = (type: ExportType) => {
    switch (type) {
      case "clients":
        return "Clients";

      case "commandes":
        return "Commandes";

      case "paiements":
        return "Paiements";

      case "all":
        return "Toutes les données";
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!selectedType) return;

    const type = selectedType;
    const rows = getRowsForType(type);

    if (!rows.length) {
      toast.info("Aucune donnée à exporter.");
      return;
    }

    // On mémorise précisément le format sélectionné
    setExportingFormat(format);

    try {
      const title = getExportTitle(type);
      const fileDate = getFileDate();

      // ================================
      // CSV
      // ================================

      if (format === "csv") {
        const csv = rowsToCsv(
          rows as Record<string, unknown>[]
        );

        downloadBlob(
          csv,
          `${title
            .toLowerCase()
            .replace(/\s+/g, "-")}-${fileDate}.csv`,
          "text/csv;charset=utf-8;"
        );

        toast.success("Fichier CSV exporté.");
      }

      // ================================
      // EXCEL
      // ================================

      if (format === "xlsx") {
        const XLSX = await import("xlsx");

        const worksheet = XLSX.utils.json_to_sheet(rows);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          type === "all" ? "Données" : title
        );

        const columnWidths = Object.keys(rows[0]).map(
          (key) => {
            const maxLength = Math.max(
              key.length,
              ...rows.map((row) =>
                String(
                  (row as Record<string, unknown>)[key] ??
                    ""
                ).length
              )
            );

            return {
              wch: Math.min(
                Math.max(maxLength + 2, 12),
                45
              ),
            };
          }
        );

        worksheet["!cols"] = columnWidths;

        XLSX.writeFile(
          workbook,
          `${title
            .toLowerCase()
            .replace(/\s+/g, "-")}-${fileDate}.xlsx`
        );

        toast.success("Fichier Excel exporté.");
      }

      // ================================
      // PDF
      // ================================

      if (format === "pdf") {
        const jsPDFModule = await import("jspdf");
        const autoTableModule = await import(
          "jspdf-autotable"
        );

        const JsPDF = jsPDFModule.default;

        const doc = new JsPDF({
          orientation:
            type === "all" || type === "commandes"
              ? "landscape"
              : "portrait",
          unit: "mm",
          format: "a4",
        });

        const headers = Object.keys(rows[0]);

        const body = rows.map((row) =>
          headers.map(
            (header) =>
              String(
                (row as Record<string, unknown>)[
                  header
                ] ?? ""
              )
          )
        );

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(title, 14, 15);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        doc.text(
          `Export effectué le ${formatDate(
            new Date().toISOString().slice(0, 10)
          )}`,
          14,
          22
        );

        autoTableModule.default(doc, {
          head: [headers],
          body,
          startY: 28,
          theme: "grid",
          styles: {
            font: "helvetica",
            fontSize:
              type === "all"
                ? 7
                : type === "commandes"
                  ? 8
                  : 9,
            cellPadding: 3,
            overflow: "linebreak",
          },
          headStyles: {
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [248, 248, 248],
          },
          margin: {
            top: 28,
            right: 10,
            bottom: 10,
            left: 10,
          },
        });

        doc.save(
          `${title
            .toLowerCase()
            .replace(/\s+/g, "-")}-${fileDate}.pdf`
        );

        toast.success("Fichier PDF exporté.");
      }

      setShowFormatModal(false);
      setSelectedType(null);
    } catch (error) {
      console.error(error);

      toast.error(
        "Impossible de générer le fichier."
      );
    } finally {
      // On arrête uniquement le chargement du format sélectionné
      setExportingFormat(null);
    }
  };

  const openExportModal = (type: ExportType) => {
    const rows = getRowsForType(type);

    if (!rows.length) {
      toast.info("Il n'y a aucune donnée à exporter.");
      return;
    }

    setSelectedType(type);
    setShowFormatModal(true);
  };

  const cards = [
    {
      type: "clients" as ExportType,
      title: "Clients",
      description:
        "Exportez la liste de vos clients avec leurs coordonnées.",
      icon: Users,
      count: clients.length,
    },
    {
      type: "commandes" as ExportType,
      title: "Commandes",
      description:
        "Exportez vos commandes, montants versés et restes à payer.",
      icon: Receipt,
      count: accounts.length,
    },
    {
      type: "paiements" as ExportType,
      title: "Paiements",
      description:
        "Exportez l'historique des paiements enregistrés.",
      icon: WalletCards,
      count: payments.length,
    },
    {
      type: "all" as ExportType,
      title: "Toutes les données",
      description:
        "Un tableau récapitulatif de votre activité, regroupé par client.",
      icon: BarChart3,
      count: clients.length,
    },
  ];

  // ================================
  // CHARGEMENT DE LA PAGE
  // ================================

  if (loading) {
    return (
      <div className="min-h-full bg-[#FAFAF8]">
        <main className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 lg:py-9">
          <div className="mb-8">
            <div className="mb-5 h-4 w-32 animate-pulse rounded bg-neutral-200" />

            <div className="h-8 w-72 animate-pulse rounded bg-neutral-200" />

            <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-neutral-200" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-black/[0.06] bg-white p-6"
              >
                <div className="mb-5 h-11 w-11 animate-pulse rounded-xl bg-neutral-200" />

                <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />

                <div className="mt-3 h-4 w-full animate-pulse rounded bg-neutral-200" />

                <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-neutral-200" />

                <div className="mt-6 h-10 w-36 animate-pulse rounded-xl bg-neutral-200" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ================================
  // ACCÈS BUSINESS
  // ================================

  if (!isBusiness) {
    return (
      <div className="min-h-full bg-[#FAFAF8]">
        <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-5 py-12">
          <div className="w-full rounded-3xl border border-black/[0.06] bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5B5CE2]/10 text-[#5B5CE2]">
              <Lock className="h-6 w-6" />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-neutral-950">
              Fonction réservée au plan Business
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-500">
              L'export de vos clients, commandes et paiements
              est disponible avec le plan Business.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/dashboard/subscription"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#5B5CE2] px-5 text-sm font-bold text-white transition hover:bg-[#4f50d0]"
              >
                Voir le plan Business
              </Link>

              <Link
                href="/dashboard/profile"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-black/[0.08] bg-white px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Retour au profil
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FAFAF8]">
      <main className="mx-auto w-full max-w-6xl px-5 py-7 pb-24 sm:px-8 lg:py-9">
        {/* HEADER */}
        <div className="mb-8">
          <Link
            href="/dashboard/profile"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au profil
          </Link>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-[#5B5CE2]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5B5CE2]">
                Business
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-[-0.035em] text-neutral-950 sm:text-3xl">
              Données & export
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              Téléchargez vos données dans un format pratique
              pour les conserver, les analyser ou les partager.
            </p>
          </div>
        </div>

        {/* INFO */}
        <div className="mb-6 rounded-2xl border border-[#5B5CE2]/10 bg-[#5B5CE2]/[0.04] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5B5CE2]/10 text-[#5B5CE2]">
              <FileSpreadsheet className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                Des fichiers prêts à utiliser
              </h2>

              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Les exports utilisent des informations
                compréhensibles : noms, numéros, dates, montants
                et états. Les identifiants techniques de votre
                base de données ne sont jamais affichés.
              </p>
            </div>
          </div>
        </div>

        {/* CARTES */}
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.type}
                className="group rounded-2xl border border-black/[0.06] bg-white p-6 transition hover:border-[#5B5CE2]/20 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5B5CE2]/10 text-[#5B5CE2]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-500">
                    {card.count}{" "}
                    {card.count > 1
                      ? "éléments"
                      : "élément"}
                  </span>
                </div>

                <h2 className="mt-5 text-base font-bold text-neutral-900">
                  {card.title}
                </h2>

                <p className="mt-2 min-h-[40px] text-sm leading-5 text-neutral-500">
                  {card.description}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    openExportModal(card.type)
                  }
                  disabled={card.count === 0}
                  className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#5B5CE2] px-4 text-sm font-bold text-white transition hover:bg-[#4f50d0] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                >
                  Exporter
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* CONTENU */}
        <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6">
          <h2 className="text-sm font-bold text-neutral-900">
            Contenu des exports
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-bold text-neutral-800">
                Clients
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-400">
                Nom, numéro et date de création.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-neutral-800">
                Commandes
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-400">
                Client, description, montant, paiement, reste,
                date et état.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-neutral-800">
                Paiements
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-400">
                Client, montant payé et date du paiement.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-neutral-800">
                Toutes les données
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-400">
                Un résumé financier regroupé par client.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* MODALE DES FORMATS */}
      {showFormatModal && selectedType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              exportingFormat === null
            ) {
              setShowFormatModal(false);
              setSelectedType(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Exporter {getExportTitle(selectedType)}
                </h2>

                <p className="mt-1 text-xs text-neutral-400">
                  Choisissez le format du fichier.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (exportingFormat !== null) return;

                  setShowFormatModal(false);
                  setSelectedType(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-5">
              {/* ========================= */}
              {/* EXCEL */}
              {/* ========================= */}

              <button
                type="button"
                disabled={exportingFormat !== null}
                onClick={() => handleExport("xlsx")}
                className="flex w-full items-center gap-4 rounded-xl border border-black/[0.07] p-4 text-left transition hover:border-[#5B5CE2]/30 hover:bg-[#5B5CE2]/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  {exportingFormat === "xlsx" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-neutral-900">
                    Excel
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    Format .xlsx modifiable dans Excel ou
                    Google Sheets.
                  </p>
                </div>
              </button>

              {/* ========================= */}
              {/* CSV */}
              {/* ========================= */}

              <button
                type="button"
                disabled={exportingFormat !== null}
                onClick={() => handleExport("csv")}
                className="flex w-full items-center gap-4 rounded-xl border border-black/[0.07] p-4 text-left transition hover:border-[#5B5CE2]/30 hover:bg-[#5B5CE2]/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  {exportingFormat === "csv" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-neutral-900">
                    CSV
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    Format simple compatible avec la plupart des
                    tableurs.
                  </p>
                </div>
              </button>

              {/* ========================= */}
              {/* PDF */}
              {/* ========================= */}

              <button
                type="button"
                disabled={exportingFormat !== null}
                onClick={() => handleExport("pdf")}
                className="flex w-full items-center gap-4 rounded-xl border border-black/[0.07] p-4 text-left transition hover:border-[#5B5CE2]/30 hover:bg-[#5B5CE2]/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  {exportingFormat === "pdf" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-neutral-900">
                    PDF
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    Format pratique pour consulter ou partager vos
                    données.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div> 
  );
}