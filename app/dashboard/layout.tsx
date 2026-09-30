"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import Sidebar from "@/components/dashboard/sidebar";
import BottomNav from "@/components/dashboard/bottom-nav";
import AddPaymentDialog from "@/components/dashboard/add-payment-dialog";

type Profile = {
  full_name: string | null;
  activity: string | null;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    activity: null,
  });

  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("full_name, activity")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        activity: data.activity || null,
      });
    }
  }, [router, supabase]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const userName = profile.full_name || "Utilisateur";

  const userInitial =
    userName.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF8]">
      {/* SIDEBAR FIXE */}
      <Sidebar
        userName={userName}
        userInitial={userInitial}
        activity={profile.activity}
      />

      {/* ZONE DROITE */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* SEULE CETTE ZONE DÉFILE */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>

        {/* NAVIGATION MOBILE */}
        <BottomNav
          onAddPayment={() => setAddPaymentOpen(true)}
        />
      </div>

      <AddPaymentDialog
        open={addPaymentOpen}
        onOpenChange={setAddPaymentOpen}
        onPaymentAdded={() => router.refresh()}
      />
    </div>
  );
}