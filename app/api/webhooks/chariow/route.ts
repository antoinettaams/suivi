import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Client Supabase Service Role (donne accès d'écriture sans restriction utilisateur)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    // 1. Clé secrète optionnelle pour sécuriser la route contre les faux appels
    const authHeader = req.headers.get("x-chariow-secret") || req.headers.get("authorization");
    if (process.env.CHARIOW_WEBHOOK_SECRET) {
      if (authHeader !== process.env.CHARIOW_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Extraire le corps de la requête envoyée par Chariow
    const payload = await req.json();

    /* 
       Le payload Chariow contient généralement :
       - event / type : type d'événement (ex: "order.paid" ou "payment.success")
       - customer / email : email du client
       - amount : montant payé
       - product_id / order_id : ID de la commande ou du produit
    */

    const { event, data, customer, id, email, status } = payload;

    // Récupérer l'email de l'acheteur (selon la structure envoyée)
    const customerEmail = customer?.email || email || data?.customer_email;
    const isSuccess = event === "order.paid" || status === "completed" || status === "paid" || payload.status === "SUCCESS";

    if (isSuccess && customerEmail) {
      // 3. Mettre à jour la base de données Supabase
      // Ex: passer le statut du paiement ou l'abonnement à 'paid' / 'active'
      const { error } = await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          chariow_order_id: id || payload.order_id,
        })
        .eq("user_email", customerEmail);

      if (error) {
        console.error("Erreur lors de la mise à jour Supabase :", error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }

      console.log(`Paiement Chariow validé avec succès pour : ${customerEmail}`);
    }

    // 4. Répondre 200 à Chariow pour confirmer la réception
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err: any) {
    console.error("Erreur Webhook Chariow :", err?.message);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}