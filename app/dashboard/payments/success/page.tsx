import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

function SuccessContent() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="mb-4 rounded-full bg-green-100 p-3 text-green-600">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        Paiement confirmé !
      </h1>
      
      <p className="mt-2 text-sm text-gray-600 max-w-md">
        Merci pour votre achat sur Chariow. Votre commande a été enregistrée et votre accès a été mis à jour.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          Accéder à mon tableau de bord
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function ChariowSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Validation de votre achat...</div>}>
      <SuccessContent />
    </Suspense>
  );
}