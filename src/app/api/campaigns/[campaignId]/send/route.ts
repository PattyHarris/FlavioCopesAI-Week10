import { NextResponse } from "next/server";

import { sendQueuedCampaignForCurrentUser } from "@/lib/newsletters";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      campaignId: string;
    }>;
  },
) {
  const { campaignId } = await context.params;
  const body = (await request.json()) as {
    newsletterSlug?: string;
  };

  if (!body.newsletterSlug) {
    return NextResponse.json({ error: "Newsletter is required." }, { status: 400 });
  }

  try {
    const result = await sendQueuedCampaignForCurrentUser({
      newsletterSlug: body.newsletterSlug,
      campaignId,
    });

    return NextResponse.json({
      message: `Sent ${result.sentCount} emails through Resend.`,
      campaignId: result.campaignId,
      sentCount: result.sentCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to send campaign.",
      },
      { status: 500 },
    );
  }
}
