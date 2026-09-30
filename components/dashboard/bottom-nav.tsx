"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Home,
  Plus,
  UserRound,
  Users,
} from "lucide-react";

type BottomNavProps = {
  onAddPayment: () => void;
};

export default function BottomNav({
  onAddPayment,
}: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  };

  return (
    <nav className="shrink-0 border-t border-neutral-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between">
        {/* Accueil */}
        <Link
          href="/dashboard"
          className={`flex min-w-[52px] flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive("/dashboard")
              ? "text-[#5B5CE2]"
              : "text-neutral-400"
          }`}
        >
          <Home
            className="h-5 w-5"
            strokeWidth={isActive("/dashboard") ? 2.2 : 1.8}
          />
          Accueil
        </Link>

        {/* Paiements */}
        <Link
          href="/dashboard/payments"
          className={`flex min-w-[52px] flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive("/dashboard/payments")
              ? "text-[#5B5CE2]"
              : "text-neutral-400"
          }`}
        >
          <CreditCard
            className="h-5 w-5"
            strokeWidth={
              isActive("/dashboard/payments") ? 2.2 : 1.8
            }
          />
          Paiements
        </Link>

        {/* Ajouter */}
        <button
          type="button"
          onClick={onAddPayment}
          className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-[#5B5CE2] text-white shadow-lg shadow-[#5B5CE2]/25 transition-transform active:scale-95"
          aria-label="Ajouter un paiement"
        >
          <Plus className="h-6 w-6" strokeWidth={2} />
        </button>

        {/* Clients */}
        <Link
          href="/dashboard/clients"
          className={`flex min-w-[52px] flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive("/dashboard/clients")
              ? "text-[#5B5CE2]"
              : "text-neutral-400"
          }`}
        >
          <Users
            className="h-5 w-5"
            strokeWidth={
              isActive("/dashboard/clients") ? 2.2 : 1.8
            }
          />
          Clients
        </Link>

        {/* Profil */}
        <Link
          href="/dashboard/profile"
          className={`flex min-w-[52px] flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive("/dashboard/profile") ||
            isActive("/dashboard/settings")
              ? "text-[#5B5CE2]"
              : "text-neutral-400"
          }`}
        >
          <UserRound
            className="h-5 w-5"
            strokeWidth={
              isActive("/dashboard/profile") ||
              isActive("/dashboard/settings")
                ? 2.2
                : 1.8
            }
          />
          Profil
        </Link>
      </div>
    </nav>
  ); 
}