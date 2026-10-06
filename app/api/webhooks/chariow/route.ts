import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Webhook Chariow reçu :", body);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erreur webhook Chariow :", error);

    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}