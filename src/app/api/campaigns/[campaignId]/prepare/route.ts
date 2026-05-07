import { NextResponse } from "next/server";

import { prepareCampaignSendForCurrentUser } from "@/lib/newsletters";

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
    const result = await prepareCampaignSendForCurrentUser({
      newsletterSlug: body.newsletterSlug,
      campaignId,
    });

    return NextResponse.json({
      message: `Prepared ${result.queuedRecipients} delivery records.`,
      campaignId: result.campaignId,
      queuedRecipients: result.queuedRecipients,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to prepare campaign send.",
      },
      { status: 500 },
    );
  }
}
