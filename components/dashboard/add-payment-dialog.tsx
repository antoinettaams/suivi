"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Phone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentAdded?: () => void;
};

type Plan = "gratuit" | "pro" | "business";

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  return new Date(now.getTime() - offset * 60 * 1000)
    .toISOString()
    .split("T")[0];
}

export default function AddPaymentDialog({
  open,
  onOpenChange,
  onPaymentAdded,
}: AddPaymentDialogProps) {
  const supabase = createClient();

  const [client, setClient] = useState("");
  const [phone, setPhone] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [firstPayment, setFirstPayment] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getToday());
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(false);

  const [plan, setPlan] = useState<Plan>("gratuit");
  const [clientsCount, setClientsCount] = useState(0);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const clientLimit =
    plan === "gratuit" ? 10 : plan === "pro" ? 100 : Infinity;

  const isLimitReached =
    clientLimit !== Infinity && clientsCount >= clientLimit;

  const canUseDueDate =
    plan === "pro" || plan === "business";

  useEffect(() => {
    if (!open) return;

    loadPlanAndClients();
  }, [open]);

  async function loadPlanAndClients() {
    setLoadingPlan(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setPlan("gratuit");
        setClientsCount(0);
        return;
      }

      const {
        data: subscription,
        error: subscriptionError,
      } = await supabase
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error(
          "Erreur lors du chargement de l'abonnement:",
          subscriptionError
        );
      }

      let currentPlan: Plan = "gratuit";

      if (
        subscription &&
        subscription.status === "active" &&
        (subscription.plan === "gratuit" ||
          subscription.plan === "pro" ||
          subscription.plan === "business")
      ) {
        if (
          subscription.plan !== "gratuit" &&
          subscription.expires_at &&
          new Date(subscription.expires_at) <= new Date()
        ) {
          currentPlan = "gratuit";
        } else {
          currentPlan = subscription.plan;
        }
      }

      setPlan(currentPlan);

      const {
        count,
        error: clientsError,
      } = await supabase
        .from("clients")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id);

      if (clientsError) {
        console.error(
          "Erreur lors du comptage des clients:",
          clientsError
        );

        setClientsCount(0);
      } else {
        setClientsCount(count ?? 0);
      }
    } catch (error) {
      console.error(
        "Erreur inattendue lors du chargement du plan:",
        error
      );

      setPlan("gratuit");
      setClientsCount(0);
    } finally {
      setLoadingPlan(false);
    }
  }

  const total = Number(totalAmount) || 0;
  const payment = Number(firstPayment) || 0;

  const remaining = Math.max(total - payment, 0);

  const isFullyPaid =
    total > 0 &&
    payment > 0 &&
    payment >= total;

  function resetForm() {
    setClient("");
    setPhone("");
    setTotalAmount("");
    setFirstPayment("");
    setDescription("");
    setDate(getToday());
    setDueDate("");
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const numericTotal = Number(totalAmount);
    const numericPayment = Number(firstPayment);

    if (!client.trim()) {
      toast.error("Veuillez renseigner le nom du client.");
      return;
    }

    if (!totalAmount || numericTotal <= 0) {
      toast.error("Veuillez renseigner un montant total valide.");
      return;
    }

    if (!firstPayment || numericPayment <= 0) {
      toast.error("Veuillez renseigner le premier versement.");
      return;
    }

    if (numericPayment > numericTotal) {
      toast.error(
        "Le premier versement ne peut pas dépasser le montant total."
      );
      return;
    }

    if (!date) {
      toast.error("Veuillez sélectionner une date.");
      return;
    }

    if (canUseDueDate && dueDate && dueDate < date) {
      toast.error(
        "La date d'échéance ne peut pas être antérieure à la date de la commande."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error(
          "Votre session a expiré. Veuillez vous reconnecter."
        );
        return;
      }

      /*
       * On recompte les clients juste avant l'enregistrement.
       */
      const {
        count: currentClientsCount,
        error: countError,
      } = await supabase
        .from("clients")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id);

      if (countError) {
        console.error(countError);

        toast.error(
          "Impossible de vérifier la limite de votre abonnement."
        );

        return;
      }

      const actualClientsCount =
        currentClientsCount ?? 0;

      /*
       * Recherche du client existant.
       */
      const cleanName = client.trim();
      const cleanPhone = phone.trim();

      let clientId: string | null = null;
      let existingClientFound = false;
      let clientWasCreated = false;

      if (cleanPhone) {
        const {
          data: existingClient,
          error: searchPhoneError,
        } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .eq("phone", cleanPhone)
          .limit(1)
          .maybeSingle();

        if (searchPhoneError) {
          console.error(searchPhoneError);

          toast.error(
            "Impossible de vérifier le client."
          );

          return;
        }

        if (existingClient) {
          clientId = existingClient.id;
          existingClientFound = true;
        }
      }

      /*
       * Si aucun client n'a été trouvé par téléphone,
       * recherche par nom.
       */
      if (!clientId) {
        const {
          data: existingClient,
          error: searchNameError,
        } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .ilike("name", cleanName)
          .limit(1)
          .maybeSingle();

        if (searchNameError) {
          console.error(searchNameError);

          toast.error(
            "Impossible de vérifier le client."
          );

          return;
        }

        if (existingClient) {
          clientId = existingClient.id;
          existingClientFound = true;
        }
      }

      /*
       * La limite concerne uniquement la création
       * d'un nouveau client.
       */
      if (!existingClientFound) {
        if (
          clientLimit !== Infinity &&
          actualClientsCount >= clientLimit
        ) {
          if (plan === "gratuit") {
            toast.error(
              "Vous avez atteint la limite de 10 clients du plan Gratuit. Passez au plan Pro pour ajouter un nouveau client."
            );
          } else {
            toast.error(
              "Vous avez atteint la limite de 100 clients du plan Pro. Passez au plan Business pour ajouter un nouveau client."
            );
          }

          return;
        }
      }

      /*
       * Création du client uniquement s'il n'existe pas.
       */
      if (!clientId) {
        const {
          data: newClient,
          error: clientError,
        } = await supabase
          .from("clients")
          .insert({
            user_id: user.id,
            name: cleanName,
            phone: cleanPhone || null,
          })
          .select("id")
          .single();

        if (clientError || !newClient) {
          console.error(clientError);

          toast.error(
            "Impossible d'enregistrer le client."
          );

          return;
        }

        clientId = newClient.id;
        clientWasCreated = true;
      } else if (cleanPhone) {
        /*
         * Mise à jour du téléphone si nécessaire.
         */
        const {
          error: updateClientError,
        } = await supabase
          .from("clients")
          .update({
            phone: cleanPhone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", clientId)
          .eq("user_id", user.id);

        if (updateClientError) {
          console.error(updateClientError);
        }
      }

      /*
       * Sécurité supplémentaire.
       */
      if (!clientId) {
        toast.error(
          "Impossible d'identifier le client."
        );

        return;
      }

      const accountStatus =
        numericPayment >= numericTotal
          ? "paid"
          : "pending";

      /*
       * Création de la commande.
       */
      const accountData: {
        user_id: string;
        client_id: string;
        description: string | null;
        total_amount: number;
        status: "paid" | "pending";
        account_date: string;
        due_date?: string | null;
      } = {
        user_id: user.id,
        client_id: clientId,
        description:
          description.trim() || null,
        total_amount: numericTotal,
        status: accountStatus,
        account_date: date,
      };

      if (canUseDueDate) {
        accountData.due_date =
          dueDate || null;
      }

      const {
        data: account,
        error: accountError,
      } = await supabase
        .from("accounts")
        .insert(accountData)
        .select("id")
        .single();

      if (accountError || !account) {
        console.error(accountError);

        toast.error(
          "Le client a été enregistré, mais la commande n'a pas pu être créée."
        );

        return;
      }

      /*
       * Enregistrement du premier versement.
       */
      const {
        data: paymentData,
        error: paymentError,
      } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          account_id: account.id,
          amount: numericPayment,
          payment_date: date,
        })
        .select("id")
        .single();

      if (paymentError || !paymentData) {
        console.error(paymentError);

        /*
         * Si le paiement échoue, on supprime la commande
         * afin de ne pas laisser une commande sans versement.
         */
        await supabase
          .from("accounts")
          .delete()
          .eq("id", account.id)
          .eq("user_id", user.id);

        /*
         * Si le client venait juste d'être créé,
         * on le supprime également.
         */
        if (clientWasCreated) {
          await supabase
            .from("clients")
            .delete()
            .eq("id", clientId)
            .eq("user_id", user.id);
        }

        toast.error(
          "Impossible d'enregistrer le versement. Rien n'a été ajouté."
        );

        return;
      }

      /*
       * ==========================================
       * HISTORIQUE BUSINESS
       * ==========================================
       *
       * On enregistre uniquement les événements
       * principaux de cette opération.
       */

      /*
       * 1. Nouveau client
       */
      if (clientWasCreated) {
        const { error: historyClientError } =
          await supabase
            .from("activity_logs")
            .insert({
              user_id: user.id,
              action: "client_created",
              description: "Nouveau client ajouté",
              client_id: clientId,
              account_id: null,
              amount: null,
            });

        if (historyClientError) {
          console.error(
            "Erreur historique client:",
            historyClientError
          );
        }
      }

      /*
       * 2. Nouvelle commande
       */
      const { error: historyOrderError } =
        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            action: "order_created",
            description:
              description.trim() ||
              "Nouvelle commande",
            client_id: clientId,
            account_id: account.id,
            amount: numericTotal,
          });

      if (historyOrderError) {
        console.error(
          "Erreur historique commande:",
          historyOrderError
        );
      }

      /*
       * 3. Premier paiement
       */
      const { error: historyPaymentError } =
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action: "payment_received",
          description: "Paiement reçu",
          client_id: clientId,
          account_id: account.id,
          payment_id: paymentData.id,
          amount: numericPayment,
        });

      if (historyPaymentError) {
        console.error(
          "Erreur historique paiement:",
          historyPaymentError
        );
      }

      /*
       * Mise à jour du compteur local.
       */
      if (!existingClientFound) {
        setClientsCount(
          (previousCount) => previousCount + 1
        );
      }

      toast.success(
        isFullyPaid
          ? "Commande enregistrée et entièrement payée."
          : "Commande et premier versement enregistrés."
      );

      resetForm();

      onOpenChange(false);

      onPaymentAdded?.();
    } catch (error) {
      console.error(error);

      toast.error(
        "Une erreur inattendue est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  const planLabel =
    plan === "gratuit"
      ? "Gratuit"
      : plan === "pro"
        ? "Pro"
        : "Business";

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!loading) {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5B5CE2]/[0.09]">
              <CreditCard className="h-5 w-5 text-[#5B5CE2]" />
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold tracking-[-0.025em] sm:text-xl">
                Ajouter une commande
              </DialogTitle>

              <DialogDescription className="text-xs text-neutral-500 sm:text-sm">
                Enregistrez une commande et son premier
                versement.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* INFORMATIONS PLAN */}
        <div className="mt-4 rounded-xl border border-black/[0.06] bg-neutral-50 px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium text-neutral-400">
                Votre abonnement
              </p>

              <p className="mt-0.5 text-sm font-semibold text-neutral-800">
                Plan {planLabel}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] font-medium text-neutral-400">
                Clients
              </p>

              <p className="mt-0.5 text-sm font-semibold text-neutral-800">
                {loadingPlan
                  ? "..."
                  : clientLimit === Infinity
                    ? `${clientsCount} / ∞`
                    : `${clientsCount} / ${clientLimit}`}
              </p>
            </div>
          </div>
        </div>

        {/* LIMITE ATTEINTE */}
        {isLimitReached && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
            <p className="text-xs font-semibold text-amber-800">
              Limite de clients atteinte
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              {plan === "gratuit"
                ? "Vous avez atteint les 10 clients autorisés par le plan Gratuit. Vous pouvez toujours ajouter des commandes à vos clients existants. Pour ajouter un nouveau client, passez au plan Pro."
                : "Vous avez atteint les 100 clients autorisés par le plan Pro. Vous pouvez toujours ajouter des commandes à vos clients existants. Pour ajouter un nouveau client, passez au plan Business."}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4"
        >
          {/* CLIENT */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="client"
                className="text-xs font-semibold"
              >
                Nom du client
              </Label>

              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <Input
                  id="client"
                  value={client}
                  onChange={(e) =>
                    setClient(e.target.value)
                  }
                  placeholder="Ex. Grâce"
                  className="h-10 rounded-xl pl-10 text-sm"
                  disabled={
                    loading || loadingPlan
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="phone"
                className="text-xs font-semibold"
              >
                Téléphone{" "}
                <span className="ml-1 font-normal text-neutral-400">
                  (optionnel)
                </span>
              </Label>

              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="+229 97 XX XX XX"
                  className="h-10 rounded-xl pl-10 text-sm"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* MONTANTS */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="totalAmount"
                className="text-xs font-semibold"
              >
                Montant total
              </Label>

              <div className="relative">
                <Input
                  id="totalAmount"
                  type="number"
                  min="1"
                  step="1"
                  value={totalAmount}
                  onChange={(e) =>
                    setTotalAmount(
                      e.target.value
                    )
                  }
                  onWheel={(e) =>
                    e.currentTarget.blur()
                  }
                  placeholder="Ex. 50000"
                  className="h-10 rounded-xl pr-10 text-sm"
                  disabled={loading}
                />

                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400">
                  F
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="firstPayment"
                className="text-xs font-semibold"
              >
                Premier versement
              </Label>

              <div className="relative">
                <Input
                  id="firstPayment"
                  type="number"
                  min="1"
                  step="1"
                  value={firstPayment}
                  onChange={(e) =>
                    setFirstPayment(
                      e.target.value
                    )
                  }
                  onWheel={(e) =>
                    e.currentTarget.blur()
                  }
                  placeholder="Ex. 10000"
                  className="h-10 rounded-xl pr-10 text-sm"
                  disabled={loading}
                />

                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400">
                  F
                </span>
              </div>
            </div>
          </div>

          {/* RÉSUMÉ */}
          {total > 0 &&
            payment > 0 &&
            payment <= total && (
              <div className="rounded-xl border border-[#5B5CE2]/10 bg-[#5B5CE2]/[0.04] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-neutral-500">
                    Résumé
                  </p>

                  {isFullyPaid ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Payé
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      En attente
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] text-neutral-400">
                      Total
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {total.toLocaleString(
                        "fr-FR"
                      )}{" "}
                      F
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-neutral-400">
                      Versé
                    </p>

                    <p className="mt-1 text-sm font-semibold text-emerald-600">
                      {payment.toLocaleString(
                        "fr-FR"
                      )}{" "}
                      F
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-neutral-400">
                      Reste
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#5B5CE2]">
                      {remaining.toLocaleString(
                        "fr-FR"
                      )}{" "}
                      F
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* DESCRIPTION */}
          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="text-xs font-semibold"
            >
              Description{" "}
              <span className="font-normal text-neutral-400">
                (optionnelle)
              </span>
            </Label>

            <Input
              id="description"
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Ex. Commande de 2 robes"
              className="h-10 rounded-xl text-sm"
              disabled={loading}
            />
          </div>

          {/* DATE DE LA COMMANDE */}
          <div className="space-y-1.5">
            <Label
              htmlFor="date"
              className="text-xs font-semibold"
            >
              Date
            </Label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="h-10 rounded-xl pl-10 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {/* ÉCHÉANCE PRO / BUSINESS */}
          {canUseDueDate && (
            <div className="rounded-xl border border-[#5B5CE2]/10 bg-[#5B5CE2]/[0.035] p-4">
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#5B5CE2]" />

                  <p className="text-xs font-semibold text-neutral-700">
                    Suivi de l'échéance
                  </p>
                </div>

                <p className="mt-1 text-[11px] leading-5 text-neutral-400">
                  Disponible avec les plans Pro
                  et Business.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="dueDate"
                  className="text-xs font-semibold"
                >
                  Date d'échéance{" "}
                  <span className="font-normal text-neutral-400">
                    (optionnelle)
                  </span>
                </Label>

                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  min={date || undefined}
                  onChange={(e) =>
                    setDueDate(
                      e.target.value
                    )
                  }
                  className="h-10 rounded-xl text-sm"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl text-sm"
              disabled={loading}
              onClick={() =>
                onOpenChange(false)
              }
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={
                loading ||
                loadingPlan
              }
              className="h-10 rounded-xl bg-[#5B5CE2] px-6 text-sm hover:bg-[#4D4ED0]"
            >
              {loading
                ? "Enregistrement..."
                : "Enregistrer la commande"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}