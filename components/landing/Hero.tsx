"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Wallet,
  CheckCircle2,
  Clock3,
  TrendingUp,
  Users,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

const DASHBOARD_SLIDES = [
  {
    id: "dashboard",
    label: "Accueil",
  },
  {
    id: "payments",
    label: "Paiements",
  },
  {
    id: "clients",
    label: "Clients",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const wheelLocked = useRef(false);
  const touchStartX = useRef<number | null>(null);

  const goToSlide = (index: number) => {
    setCurrentSlide(
      Math.max(0, Math.min(index, DASHBOARD_SLIDES.length - 1))
    );
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (wheelLocked.current) return;

    const delta = event.deltaY;

    // Ignore les mouvements trop faibles
    if (Math.abs(delta) < 10) return;

    wheelLocked.current = true;

    if (delta > 0) {
      goToSlide(currentSlide + 1);
    } else {
      goToSlide(currentSlide - 1);
    }

    // Empêche plusieurs changements pendant le même geste
    window.setTimeout(() => {
      wheelLocked.current = false;
    }, 750);
  };

  const handleTouchStart = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    if (touchStartX.current === null) return;

    const touchEndX = event.changedTouches[0]?.clientX ?? 0;
    const difference = touchStartX.current - touchEndX;

    // On ignore les petits mouvements
    if (Math.abs(difference) < 45) {
      touchStartX.current = null;
      return;
    }

    if (difference > 0) {
      // Swipe vers la gauche
      goToSlide(currentSlide + 1);
    } else {
      // Swipe vers la droite
      goToSlide(currentSlide - 1);
    }

    touchStartX.current = null;
  };

  return (
    <section className="relative overflow-hidden bg-[#FAFAF8]">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8 lg:px-10 lg:pb-28 lg:pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl"
          >
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#5B5CE2]/10 bg-white px-3.5 py-2 text-sm font-medium text-[#5B5CE2] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#5B5CE2]" />
              Simple. Clair. Sans prise de tête.
            </div>

            {/* Title */}
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-neutral-950 sm:text-5xl lg:text-[60px]">
              Vous savez toujours ce qu’il vous reste{" "}
              <span className="text-[#5B5CE2]">à encaisser.</span>
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-lg text-base leading-7 text-neutral-600 sm:text-lg">
              Suivez vos acomptes, vos paiements et vos restes à payer
              simplement. Plus besoin de fouiller vos conversations pour
              savoir qui vous doit encore de l’argent.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#5B5CE2] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4f50d2]"
              >
                Commencer gratuitement
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>

              <a
                href="#fonctionnement"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                Voir comment ça marche
                <ChevronDown size={17} />
              </a>
            </div>

            {/* Trust */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-500">
              <div className="flex items-center gap-2">
                <Check
                  size={16}
                  className="text-[#5B5CE2]"
                />
                Gratuit pour commencer
              </div>

              <div className="flex items-center gap-2">
                <Check
                  size={16}
                  className="text-[#5B5CE2]"
                />
                Aucune carte bancaire
              </div>

              <div className="flex items-center gap-2">
                <Check
                  size={16}
                  className="text-[#5B5CE2]"
                />
                Pensé pour les petits pros
              </div>
            </div>
          </motion.div>

          {/* RIGHT - DASHBOARD CAROUSEL */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.15,
            }}
            className="relative"
          >
            <div
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative mx-auto w-full max-w-[650px] select-none"
            >
              {/* Glow */}
              <div className="absolute -inset-6 rounded-[36px] bg-[#5B5CE2]/5 blur-3xl" />

              {/* Dashboard window */}
              <div className="relative overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.08)]">
                {/* Browser header */}
                <div className="flex h-12 items-center justify-between border-b border-neutral-100 bg-white px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
                  </div>

                  <div className="hidden rounded-md bg-neutral-50 px-12 py-1.5 text-[10px] text-neutral-400 sm:block">
                    app.reste.fr
                  </div>

                  <div className="w-12" />
                </div>

                {/* Dashboard */}
                <div className="flex min-h-[390px] bg-[#FAFAF8] sm:min-h-[430px]">
                  {/* Sidebar */}
                  <div className="hidden w-[115px] shrink-0 border-r border-neutral-100 bg-white p-3 sm:block">
                    {/* Logo */}
                    <div className="mb-8 flex items-center gap-1.5 px-1">
                      <span className="text-sm font-bold text-neutral-900">
                        reste.
                      </span>
                    </div>

                    <div className="space-y-1">
                      <SidebarItem
                        icon={<Wallet size={13} />}
                        label="Accueil"
                        active={currentSlide === 0}
                      />

                      <SidebarItem
                        icon={<CreditCard size={13} />}
                        label="Paiements"
                        active={currentSlide === 1}
                      />

                      <SidebarItem
                        icon={<Users size={13} />}
                        label="Clients"
                        active={currentSlide === 2}
                      />

                      <SidebarItem
                        icon={<TrendingUp size={13} />}
                        label="Stats"
                        active={false}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                      {currentSlide === 0 && (
                        <DashboardView key="dashboard" />
                      )}

                      {currentSlide === 1 && (
                        <PaymentsView key="payments" />
                      )}

                      {currentSlide === 2 && (
                        <ClientsView key="clients" />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Dots */}
              <div className="mt-5 flex justify-center gap-2">
                {DASHBOARD_SLIDES.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Afficher ${slide.label}`}
                    onClick={() => goToSlide(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? "w-7 bg-[#5B5CE2]"
                        : "w-1.5 bg-neutral-300 hover:bg-neutral-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#FAFAF8] to-transparent" />
    </section>
  );
}

/* ============================================================
   SIDEBAR ITEM
============================================================ */

function SidebarItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[10px] font-medium transition ${
        active
          ? "bg-[#5B5CE2]/10 text-[#5B5CE2]"
          : "text-neutral-400"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

/* ============================================================
   DASHBOARD VIEW
============================================================ */

function DashboardView() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 25 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -25 }}
      transition={{ duration: 0.3 }}
      className="h-full p-4 sm:p-6"
    >
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-[9px] text-neutral-400">
            Bonjour 👋
          </p>

          <h2 className="mt-0.5 text-sm font-semibold text-neutral-900 sm:text-base">
            Votre activité
          </h2>
        </div>

        <div className="rounded-lg bg-[#5B5CE2]/10 px-2.5 py-1.5 text-[9px] font-medium text-[#5B5CE2]">
          Cette semaine
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <MiniStat
          label="Commandes"
          value="125 000 F"
          icon={<Wallet size={12} />}
        />

        <MiniStat
          label="Paiements reçus"
          value="85 000 F"
          icon={<CheckCircle2 size={12} />}
        />

        <MiniStat
          label="Reste à encaisser"
          value="40 000 F"
          icon={<Clock3 size={12} />}
        />

        <MiniStat
          label="Clients"
          value="18"
          icon={<Users size={12} />}
        />
      </div>

      {/* Activity */}
      <div className="mt-5 rounded-xl border border-neutral-100 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-3.5 py-3">
          <p className="text-[10px] font-semibold text-neutral-800">
            Activité récente
          </p>

          <span className="text-[9px] text-[#5B5CE2]">
            Voir tout
          </span>
        </div>

        <div>
          <ActivityRow
            icon={<CheckCircle2 size={12} />}
            title="Paiement reçu"
            client="Marie K."
            amount="+15 000 F"
            positive
          />

          <ActivityRow
            icon={<CreditCard size={12} />}
            title="Commande créée"
            client="Paul A."
            amount="25 000 F"
          />

          <ActivityRow
            icon={<Users size={12} />}
            title="Client ajouté"
            client="Sarah D."
            amount="Nouveau client"
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   PAYMENTS VIEW
============================================================ */

function PaymentsView() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 25 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -25 }}
      transition={{ duration: 0.3 }}
      className="h-full p-4 sm:p-6"
    >
      {/* Header */}
      <div className="mb-5">
        <p className="text-[9px] text-neutral-400">
          Suivi
        </p>

        <h2 className="mt-0.5 text-sm font-semibold text-neutral-900 sm:text-base">
          Paiements
        </h2>
      </div>

      {/* Summary */}
      <div className="mb-5 grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-neutral-100 bg-white p-3">
          <p className="text-[8px] text-neutral-400">
            Total
          </p>

          <p className="mt-1 text-xs font-semibold text-neutral-900">
            125 000 F
          </p>
        </div>

        <div className="rounded-xl border border-neutral-100 bg-white p-3">
          <p className="text-[8px] text-neutral-400">
            Payé
          </p>

          <p className="mt-1 text-xs font-semibold text-[#5B5CE2]">
            85 000 F
          </p>
        </div>

        <div className="rounded-xl border border-neutral-100 bg-white p-3">
          <p className="text-[8px] text-neutral-400">
            Reste
          </p>

          <p className="mt-1 text-xs font-semibold text-orange-500">
            40 000 F
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-100 bg-white">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-neutral-100 px-3 py-2.5 text-[8px] font-medium text-neutral-400">
          <span>Client</span>
          <span>Montant</span>
          <span>État</span>
        </div>

        <PaymentRow
          name="Marie K."
          amount="15 000 F"
          status="Payé"
          paid
        />

        <PaymentRow
          name="Paul A."
          amount="25 000 F"
          status="En attente"
        />

        <PaymentRow
          name="Sarah D."
          amount="35 000 F"
          status="Payé"
          paid
        />

        <PaymentRow
          name="Aminata S."
          amount="50 000 F"
          status="En attente"
        />
      </div>
    </motion.div>
  );
}

/* ============================================================
   CLIENTS VIEW
============================================================ */

function ClientsView() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 25 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -25 }}
      transition={{ duration: 0.3 }}
      className="h-full p-4 sm:p-6"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[9px] text-neutral-400">
            Votre clientèle
          </p>

          <h2 className="mt-0.5 text-sm font-semibold text-neutral-900 sm:text-base">
            Clients
          </h2>
        </div>

        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5B5CE2] text-white">
          <Users size={13} />
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex h-8 items-center rounded-lg border border-neutral-100 bg-white px-3">
        <span className="text-[9px] text-neutral-400">
          Rechercher un client...
        </span>
      </div>

      {/* Clients */}
      <div className="space-y-2">
        <ClientRow
          name="Marie K."
          phone="+229 97 12 34 56"
          remaining="0 F"
          paid
        />

        <ClientRow
          name="Paul A."
          phone="+229 96 45 67 89"
          remaining="10 000 F"
        />

        <ClientRow
          name="Sarah D."
          phone="+229 90 11 22 33"
          remaining="0 F"
          paid
        />

        <ClientRow
          name="Aminata S."
          phone="+229 95 44 55 66"
          remaining="30 000 F"
        />
      </div>
    </motion.div>
  );
}

/* ============================================================
   MINI STAT
============================================================ */

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[8px] text-neutral-400">
          {label}
        </span>

        <span className="text-[#5B5CE2]">
          {icon}
        </span>
      </div>

      <p className="text-[11px] font-semibold text-neutral-900 sm:text-xs">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   ACTIVITY ROW
============================================================ */

function ActivityRow({
  icon,
  title,
  client,
  amount,
  positive,
}: {
  icon: React.ReactNode;
  title: string;
  client: string;
  amount: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-neutral-50 px-3.5 py-3 last:border-0">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5B5CE2]/10 text-[#5B5CE2]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[9px] font-medium text-neutral-800">
          {title}
        </p>

        <p className="truncate text-[8px] text-neutral-400">
          {client}
        </p>
      </div>

      <span
        className={`whitespace-nowrap text-[9px] font-semibold ${
          positive
            ? "text-[#5B5CE2]"
            : "text-neutral-700"
        }`}
      >
        {amount}
      </span>
    </div>
  );
}

/* ============================================================
   PAYMENT ROW
============================================================ */

function PaymentRow({
  name,
  amount,
  status,
  paid,
}: {
  name: string;
  amount: string;
  status: string;
  paid?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-neutral-50 px-3 py-3 last:border-0">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-[8px] font-semibold text-neutral-500">
          {name.charAt(0)}
        </div>

        <span className="text-[9px] font-medium text-neutral-800">
          {name}
        </span>
      </div>

      <span className="text-[9px] text-neutral-600">
        {amount}
      </span>

      <span
        className={`w-fit rounded-full px-2 py-1 text-[7px] font-medium ${
          paid
            ? "bg-[#5B5CE2]/10 text-[#5B5CE2]"
            : "bg-orange-50 text-orange-500"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

/* ============================================================
   CLIENT ROW
============================================================ */

function ClientRow({
  name,
  phone,
  remaining,
  paid,
}: {
  name: string;
  phone: string;
  remaining: string;
  paid?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white px-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5B5CE2]/10 text-[9px] font-semibold text-[#5B5CE2]">
        {name.charAt(0)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold text-neutral-800">
          {name}
        </p>

        <p className="mt-0.5 text-[8px] text-neutral-400">
          {phone}
        </p>
      </div>

      <div className="text-right">
        <p className="text-[8px] text-neutral-400">
          Reste
        </p>

        <p
          className={`mt-0.5 text-[9px] font-semibold ${
            paid
              ? "text-[#5B5CE2]"
              : "text-orange-500"
          }`}
        >
          {remaining}
        </p>
      </div>
    </div>
  );
}