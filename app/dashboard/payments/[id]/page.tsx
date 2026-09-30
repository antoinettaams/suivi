"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  Edit3,
  Loader2,
  MessageCircle,
  MoreVertical,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

type Plan = "gratuit" | "pro" | "business";

type Client = {
  id: string;
  name: string;
  phone: string | null;
};

type Account = {
  id: string;
  client_id: string;
  description: string | null;
  total_amount: number;
  status: "pending" | "paid";
  account_date: string;
  due_date: string | null;
  client: Client | Client[] | null;
};

type Payment = {
  id: string;
  account_id: string;
  amount: number;
  payment_date: string;
  created_at: string;
};

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount);
};

const formatDate = (date: string | null) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
};

const normalizeWhatsAppPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("229")) {
    return digits;
  }

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  return `229${digits}`;
};

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const accountId = String(params.id);

  const [account, setAccount] = useState<Account | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plan, setPlan] = useState<Plan>("gratuit");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [paymentToDelete, setPaymentToDelete] =
    useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [editAlreadyPaid, setEditAlreadyPaid] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const [openPaymentMenu, setOpenPaymentMenu] =
    useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscriptionData?.plan) {
        setPlan(subscriptionData.plan as Plan);
      }

      const { data: accountData, error: accountError } =
        await supabase
          .from("accounts")
          .select(
            `
            id,
            client_id,
            description,
            total_amount,
            status,
            account_date,
            due_date,
            client:clients (
              id,
              name,
              phone
            )
          `
          )
          .eq("id", accountId)
          .eq("user_id", user.id)
          .maybeSingle();

      if (accountError) {
        console.error(accountError);
        toast.error("Impossible de charger la commande.");
        return;
      }

      if (!accountData) {
        toast.error("Commande introuvable.");
        router.push("/dashboard/payments");
        return;
      }

      const normalizedAccount: Account = {
        ...accountData,
        client: Array.isArray(accountData.client)
          ? accountData.client[0] || null
          : accountData.client,
      };

      setAccount(normalizedAccount);

      const { data: paymentData, error: paymentError } =
        await supabase
          .from("payments")
          .select(
            "id, account_id, amount, payment_date, created_at"
          )
          .eq("account_id", accountId)
          .eq("user_id", user.id)
          .order("payment_date", { ascending: false })
          .order("created_at", { ascending: false });

      if (paymentError) {
        console.error(paymentError);
        toast.error("Impossible de charger les paiements.");
        return;
      }

      setPayments(paymentData || []);
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accountId, supabase]);

  const totalPaid = useMemo(() => {
    return payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
  }, [payments]);

  const totalAmountValue = Number(account?.total_amount || 0);

  const remaining = Math.max(totalAmountValue - totalPaid, 0);

  const isPaid = remaining <= 0;

  const hasDueDateAccess =
    plan === "pro" || plan === "business";

  const today = new Date().toISOString().split("T")[0];

  const isOverdue =
    hasDueDateAccess &&
    Boolean(account?.due_date) &&
    account!.due_date! < today &&
    !isPaid;

  const isDueToday =
    hasDueDateAccess &&
    Boolean(account?.due_date) &&
    account!.due_date === today &&
    !isPaid;

  const client = account?.client
    ? Array.isArray(account.client)
      ? account.client[0]
      : account.client
    : null;

  const handleWhatsAppReminder = () => {
    if (!account || !client) {
      toast.error(
        "Impossible de récupérer les informations du client."
      );
      return;
    }

    if (!hasDueDateAccess) {
      toast.info(
        "Les rappels de paiement sont disponibles avec le plan Pro."
      );
      return;
    }

    if (remaining <= 0) {
      toast.info(
        "Cette commande est déjà entièrement payée."
      );
      return;
    }

    if (!client.phone) {
      toast.error(
        "Le numéro de téléphone du client n'est pas renseigné."
      );
      return;
    }

    const phone = normalizeWhatsAppPhone(client.phone);

    if (!phone) {
      toast.error(
        "Le numéro de téléphone du client est invalide."
      );
      return;
    }

    const clientName = client.name?.trim() || "Bonjour";

    let message =
      `Bonjour ${clientName}, petit rappel concernant votre paiement. ` +
      `Il reste ${formatAmount(remaining)} F à régler pour votre commande.`;

    if (account.due_date) {
      if (isOverdue) {
        message +=
          ` L'échéance prévue le ${formatDate(
            account.due_date
          )} est dépassée.`;
      } else if (isDueToday) {
        message += " L'échéance est prévue aujourd'hui.";
      } else {
        message +=
          ` L'échéance prévue est le ${formatDate(
            account.due_date
          )}.`;
      }
    }

    message += " Merci 🙏";

    const whatsappUrl =
      `https://wa.me/${phone}` +
      `?text=${encodeURIComponent(message)}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openEditModal = () => {
    if (!account || !client) return;

    setEditName(client.name || "");
    setEditPhone(client.phone || "");
    setEditDescription(account.description || "");
    setEditTotal(String(account.total_amount));
    setEditAlreadyPaid(String(totalPaid));
    setEditDate(account.account_date);
    setEditDueDate(account.due_date || "");

    setShowEditModal(true);
  };

  const handleAddPayment = async (event: FormEvent) => {
    event.preventDefault();

    if (!account) return;

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      toast.error("Entrez un montant valide.");
      return;
    }

    if (amount > remaining) {
      toast.error(
        `Le paiement ne peut pas dépasser ${formatAmount(
          remaining
        )} F.`
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expirée.");
        return;
      }

      /*
       * On récupère l'ID du paiement créé.
       * Il sera utilisé pour l'activité historique Business.
       */
      const { data: paymentData, error: paymentError } =
        await supabase
          .from("payments")
          .insert({
            user_id: user.id,
            account_id: account.id,
            amount,
            payment_date: paymentDate,
          })
          .select("id")
          .single();

      if (paymentError || !paymentData) {
        console.error(paymentError);
        toast.error(
          paymentError?.message ||
            "Impossible d'ajouter le paiement."
        );
        return;
      }

      /*
       * On ne modifie volontairement PAS accounts.status.
       *
       * Le statut réel est calculé à partir des paiements
       * dans les pages Paiements et Détail.
       */

      const { error: activityError } = await supabase
        .from("activity_logs")
        .insert({
          user_id: user.id,
          action: "payment_received",
          description: "Paiement reçu",
          client_id: account.client_id,
          account_id: account.id,
          payment_id: paymentData.id,
          amount,
        });

      if (activityError) {
        /*
         * Le paiement existe bien même si l'activité
         * historique n'a pas pu être enregistrée.
         */
        console.error(activityError);
      }

      toast.success("Paiement ajouté.");

      setPaymentAmount("");
      setPaymentDate(
        new Date().toISOString().split("T")[0]
      );
      setShowPaymentModal(false);

      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditAccount = async (event: FormEvent) => {
    event.preventDefault();

    if (!account || !client) return;

    const total = Number(editTotal);
    const alreadyPaid = Number(editAlreadyPaid);

    if (!editName.trim()) {
      toast.error("Le nom du client est obligatoire.");
      return;
    }

    if (!total || total <= 0) {
      toast.error(
        "Le montant total doit être supérieur à 0."
      );
      return;
    }

    if (alreadyPaid < 0) {
      toast.error("Le montant déjà payé est invalide.");
      return;
    }

    if (alreadyPaid > total) {
      toast.error(
        "Le montant déjà payé ne peut pas dépasser le total."
      );
      return;
    }

    /*
     * IMPORTANT :
     *
     * On ne supprime plus tous les paiements existants
     * pour recréer un paiement global.
     *
     * Les paiements sont de vraies transactions et doivent
     * conserver leur historique individuel.
     *
     * Si le montant "Déjà payé" doit être modifié,
     * on ne touche pas aux paiements existants ici.
     */
    if (alreadyPaid !== totalPaid) {
      toast.error(
        "Pour modifier un paiement existant, utilisez son historique de paiements."
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expirée.");
        return;
      }

      const { error: clientError } = await supabase
        .from("clients")
        .update({
          name: editName.trim(),
          phone: editPhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", client.id)
        .eq("user_id", user.id);

      if (clientError) {
        console.error(clientError);
        toast.error(
          clientError.message ||
            "Impossible de modifier le client."
        );
        return;
      }

      const { error: accountError } = await supabase
        .from("accounts")
        .update({
          description:
            editDescription.trim() || null,
          total_amount: total,
          account_date: editDate,
          due_date:
            hasDueDateAccess && editDueDate
              ? editDueDate
              : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id)
        .eq("user_id", user.id);

      if (accountError) {
        console.error(accountError);
        toast.error(
          accountError.message ||
            "Impossible de modifier la commande."
        );
        return;
      }

      toast.success("Commande modifiée.");
      setShowEditModal(false);

      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!account) return;

    setDeletingPayment(true);
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expirée.");
        return;
      }

      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        toast.error(
          error.message ||
            "Impossible de supprimer le paiement."
        );
        return;
      }

      /*
       * On ne modifie volontairement PAS accounts.status.
       *
       * Le reste à payer et l'état sont recalculés
       * automatiquement à partir des paiements restants.
       */

      toast.success("Paiement supprimé.");

      setPaymentToDelete(null);
      setOpenPaymentMenu(null);

      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue.");
    } finally {
      setDeletingPayment(false);
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!account) return;

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expirée.");
        return;
      }

      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", account.id)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        toast.error(
          error.message ||
            "Impossible de supprimer la commande."
        );
        return;
      }

      toast.success("Commande supprimée.");
      setShowDeleteModal(false);

      router.push("/dashboard/payments");
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-[#FAFAF8]">
        <div className="mx-auto max-w-5xl px-5 py-7 pb-24 sm:px-8 lg:py-9">
          <div className="mb-8">
            <div className="mb-5 h-4 w-40 animate-pulse rounded bg-neutral-200" />

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-neutral-200" />

                <div className="min-w-0 space-y-2">
                  <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
                  <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="h-10 w-28 animate-pulse rounded-xl bg-neutral-200" />
                <div className="h-10 w-32 animate-pulse rounded-xl bg-neutral-200" />
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-black/[0.06] bg-white p-5"
              >
                <div className="mb-3 h-9 w-9 animate-pulse rounded-xl bg-neutral-200" />
                <div className="mb-2 h-3 w-20 animate-pulse rounded bg-neutral-200" />
                <div className="h-6 w-28 animate-pulse rounded bg-neutral-200" />
              </div>
            ))}
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-black/[0.06] bg-white p-6"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-neutral-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
                    <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />
                  </div>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3].map((row) => (
                    <div key={row} className="space-y-2">
                      <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                      <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white">
            <div className="flex flex-col gap-4 border-b border-black/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="space-y-2">
                <div className="h-5 w-48 animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
              </div>

              <div className="h-10 w-44 animate-pulse rounded-xl bg-neutral-200" />
            </div>

            <div className="divide-y divide-black/[0.05]">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-neutral-200" />

                    <div className="space-y-2">
                      <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
                      <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />
                    </div>
                  </div>

                  <div className="h-9 w-9 animate-pulse rounded-xl bg-neutral-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!account || !client) {
    return (
      <div className="min-h-full bg-[#FAFAF8]">
        <div className="mx-auto max-w-5xl px-5 py-12 text-center">
          <p className="text-sm text-neutral-500">
            Cette commande est introuvable.
          </p>

          <Link
            href="/dashboard/payments"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#5B5CE2]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux paiements
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FAFAF8]">
      <div className="mx-auto max-w-5xl px-5 py-7 pb-24 sm:px-8 lg:py-9">
        {/* HEADER */}
        <div className="mb-8">
          <Link
            href="/dashboard/payments"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux paiements
          </Link>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5B5CE2]/10 text-[#5B5CE2]">
                <User className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-2xl font-extrabold tracking-[-0.03em] text-neutral-950">
                  {client.name}
                </h1>

                <p className="mt-1 truncate text-sm text-neutral-400">
                  {client.phone || "Aucun numéro renseigné"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                <Edit3 className="h-4 w-4" />
                Modifier
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-500 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
              <CreditCard className="h-4 w-4" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400">
              Total
            </p>

            <p className="mt-1 text-xl font-extrabold text-neutral-950">
              {formatAmount(totalAmountValue)} F
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Check className="h-4 w-4" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400">
              Déjà payé
            </p>

            <p className="mt-1 text-xl font-extrabold text-neutral-950">
              {formatAmount(totalPaid)} F
            </p>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              isPaid
                ? "border-green-200 bg-green-50/60"
                : "border-orange-200 bg-orange-50/60"
            }`}
          >
            <div
              className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
                isPaid
                  ? "bg-green-100 text-green-600"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              {isPaid ? (
                <Check className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400">
              Reste à payer
            </p>

            <p className="mt-1 text-xl font-extrabold text-neutral-950">
              {formatAmount(remaining)} F
            </p>
          </div>
        </div>

        {/* CLIENT + DATES */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B5CE2]/10 text-[#5B5CE2]">
                <User className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Informations client
                </h2>

                <p className="text-xs text-neutral-400">
                  Coordonnées associées à cette commande
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-neutral-400">
                  Nom
                </p>

                <p className="mt-1 text-sm font-semibold text-neutral-800">
                  {client.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-neutral-400">
                  Téléphone
                </p>

                <p className="mt-1 text-sm font-semibold text-neutral-800">
                  {client.phone || "Non renseigné"}
                </p>
              </div>

              {account.description && (
                <div>
                  <p className="text-xs font-medium text-neutral-400">
                    Description
                  </p>

                  <p className="mt-1 text-sm text-neutral-700">
                    {account.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B5CE2]/10 text-[#5B5CE2]">
                <CalendarDays className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Dates
                </h2>

                <p className="text-xs text-neutral-400">
                  Suivi de la commande
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-neutral-400">
                  Date de la commande
                </p>

                <p className="mt-1 text-sm font-semibold text-neutral-800">
                  {formatDate(account.account_date)}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-neutral-400">
                    Échéance
                  </p>

                  {!hasDueDateAccess && (
                    <span className="rounded-full bg-[#5B5CE2]/10 px-2.5 py-1 text-[10px] font-bold text-[#5B5CE2]">
                      PRO
                    </span>
                  )}
                </div>

                {hasDueDateAccess ? (
                  <>
                    <p className="mt-1 text-sm font-semibold text-neutral-800">
                      {account.due_date
                        ? formatDate(account.due_date)
                        : "Aucune échéance"}
                    </p>

                    {isOverdue && (
                      <p className="mt-2 text-xs font-semibold text-red-500">
                        Échéance dépassée
                      </p>
                    )}

                    {isDueToday && (
                      <p className="mt-2 text-xs font-semibold text-orange-500">
                        Échéance aujourd'hui
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-xs leading-5 text-neutral-400">
                    Le suivi des échéances est disponible avec le
                    plan Pro.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* REMINDER */}
        {!isPaid && hasDueDateAccess && (
          <div className="mb-6 rounded-2xl border border-[#5B5CE2]/15 bg-[#5B5CE2]/[0.045] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5B5CE2]/10 text-[#5B5CE2]">
                  <MessageCircle className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-neutral-900">
                    Rappeler le paiement
                  </h2>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-neutral-500">
                    Prépare automatiquement un message WhatsApp
                    avec le montant restant. Le message sera
                    ouvert dans WhatsApp et vous pourrez l'envoyer
                    vous-même.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppReminder}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5B5CE2] px-4 text-sm font-bold text-white transition hover:bg-[#4f50d0]"
              >
                <MessageCircle className="h-4 w-4" />
                Rappeler par WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        <div className="rounded-2xl border border-black/[0.06] bg-white">
          <div className="flex flex-col gap-4 border-b border-black/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Historique des paiements
              </h2>

              <p className="mt-1 text-xs text-neutral-400">
                {payments.length} paiement
                {payments.length > 1 ? "s" : ""}
              </p>
            </div>

            {!isPaid && (
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#5B5CE2] px-4 text-sm font-bold text-white transition hover:bg-[#4f50d0]"
              >
                <Plus className="h-4 w-4" />
                Ajouter un paiement
              </button>
            )}
          </div>

          {payments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                <CreditCard className="h-5 w-5" />
              </div>

              <p className="text-sm font-semibold text-neutral-700">
                Aucun paiement
              </p>

              <p className="mt-1 text-xs text-neutral-400">
                Aucun paiement n'a encore été enregistré.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.05]">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="relative flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                      <Check className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-800">
                        {formatAmount(Number(payment.amount))} F
                      </p>

                      <p className="mt-0.5 text-xs text-neutral-400">
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPaymentMenu(
                          openPaymentMenu === payment.id
                            ? null
                            : payment.id
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openPaymentMenu === payment.id && (
                      <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1.5 shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenPaymentMenu(null);
                            setPaymentToDelete(payment);
                          }}
                          disabled={saving}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADD PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Ajouter un paiement
                </h2>

                <p className="mt-1 text-xs text-neutral-400">
                  Reste à payer : {formatAmount(remaining)} F
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddPayment}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-xs font-semibold text-neutral-600">
                  Montant
                </label>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={paymentAmount}
                    onChange={(event) =>
                      setPaymentAmount(
                        event.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="Ex : 5000"
                    className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3 pr-10 text-sm outline-none transition focus:border-[#5B5CE2] focus:ring-2 focus:ring-[#5B5CE2]/10"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400">
                    F
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-neutral-600">
                  Date du paiement
                </label>

                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) =>
                    setPaymentDate(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-sm outline-none transition focus:border-[#5B5CE2] focus:ring-2 focus:ring-[#5B5CE2]/10"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5B5CE2] text-sm font-bold text-white transition hover:bg-[#4f50d0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Enregistrer le paiement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Modifier la commande
                </h2>

                <p className="mt-1 text-xs text-neutral-400">
                  Les informations seront mises à jour.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleEditAccount}
              className="space-y-5 p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-neutral-600">
                    Nom du client
                  </label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(event) =>
                      setEditName(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-black/[0.08] px-3 text-sm outline-none focus:border-[#5B5CE2] focus:ring-2 focus:ring-[#5B5CE2]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-neutral-600">
                    Téléphone
                  </label>

                  <input
                    type="text"
                    value={editPhone}
                    onChange={(event) =>
                      setEditPhone(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-black/[0.08] px-3 text-sm outline-none focus:border-[#5B5CE2] focus:ring-2 focus:ring-[#5B5CE2]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-neutral-600">
                  Description
                </label>

                <textarea
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(event.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-black/[0.08] px-3 py-3 text-sm outline-none focus:border-[#5B5CE2] focus:ring-2 focus:ring-[#5B5CE2]/10"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-neutral-600">
                    Montant total
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editTotal}
                      onChange={(event) =>
                        setEditTotal(
                          event.target.value.replace(/\D/g, "")
                        )
                      }
                      className="h-11 w-full rounded-xl border border-black/[0.08] px-3 pr-10 text-sm outline-none focus:border-[#5B5CE2] focus:ring-2 focus:ring-[#5B5CE2]/10"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400">
                      F
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-neutral-600">
                    Déjà payé
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editAlreadyPaid}
                      onChange={(event) =>
                        setEditAlreadyPaid(
                          event.target.value.replace(/\D/g, "")
                        )
                      }
                      className="h-11 w-full rounded-xl border border-black/[0.08] px-3 pr-10 text-sm outline-none focus:border-[#5B5CE2] focus:ring-2 focus:ring-[#5B5CE2]/10"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400">
                      F
                    </span>
                  </div>

                  {Number(editAlreadyPaid) !== totalPaid && (
                    <p className="mt-2 text-xs leading-5 text-orange-500">
                      Le montant déjà payé est calculé à partir des
                      paiements enregistrés. Pour le modifier,
                      ajoutez ou supprimez un paiement dans
                      l'historique.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-neutral-600">
                    Date de la commande
                  </label>

                  <input
                    type="date"
                    value={editDate}
                    onChange={(event) =>
                      setEditDate(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-black/[0.08] px-3 text-sm outline-none focus:border-[#5B5CE2] focus:ring-2 focus:ring-[#5B5CE2]/10"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-neutral-600">
                      Échéance
                    </label>

                    {!hasDueDateAccess && (
                      <span className="rounded-full bg-[#5B5CE2]/10 px-2 py-0.5 text-[9px] font-bold text-[#5B5CE2]">
                        PRO
                      </span>
                    )}
                  </div>

                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(event) =>
                      setEditDueDate(event.target.value)
                    }
                    disabled={!hasDueDateAccess}
                    className="h-11 w-full rounded-xl border border-black/[0.08] px-3 text-sm outline-none transition focus:border-[#5B5CE2] focus:ring-2 focus:ring-[#5B5CE2]/10 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="h-11 rounded-xl border border-black/[0.08] bg-white px-5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5B5CE2] px-5 text-sm font-bold text-white hover:bg-[#4f50d0] disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUPPRESSION PAIEMENT */}
      {paymentToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deletingPayment
            ) {
              setPaymentToDelete(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle
                  className="h-5 w-5"
                  fill="currentColor"
                  strokeWidth={2}
                />
              </div>

              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Supprimer ce paiement ?
                </h2>

                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Le paiement de{" "}
                  <span className="font-semibold text-neutral-700">
                    {formatAmount(
                      Number(paymentToDelete.amount)
                    )}{" "}
                    F
                  </span>{" "}
                  sera définitivement supprimé. Le montant restant
                  à payer sera recalculé.
                </p>

                <p className="mt-2 text-xs font-medium text-red-500">
                  Cette action est irréversible.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPaymentToDelete(null)}
                disabled={deletingPayment}
                className="h-11 rounded-xl border border-black/[0.08] bg-white px-5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDeletePayment(paymentToDelete.id)
                }
                disabled={deletingPayment}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingPayment && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Supprimer le paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUPPRESSION COMMANDE */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setShowDeleteModal(false);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle
                  className="h-5 w-5"
                  fill="currentColor"
                  strokeWidth={2}
                />
              </div>

              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Supprimer cette commande ?
                </h2>

                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Cette action supprimera définitivement la commande
                  ainsi que tous les paiements associés.
                </p>

                <p className="mt-2 text-xs font-medium text-red-500">
                  Cette action est irréversible.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={saving}
                className="h-11 rounded-xl border border-black/[0.08] bg-white px-5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Supprimer la commande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}