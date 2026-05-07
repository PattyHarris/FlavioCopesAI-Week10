import { NextResponse } from "next/server";

import { processResendWebhookEvent } from "@/lib/email/webhooks";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      type?: string;
      created_at?: string;
      data?: {
        email_id?: string;
      };
    };

    if (!payload.type) {
      return NextResponse.json({ error: "Webhook payload missing type." }, { status: 400 });
    }

    const result = await processResendWebhookEvent({
      type: payload.type,
      created_at: payload.created_at,
      data: payload.data,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to process Resend webhook.",
      },
      { status: 500 },
    );
  }
}
