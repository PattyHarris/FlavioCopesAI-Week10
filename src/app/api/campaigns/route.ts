import { NextResponse } from "next/server";

import { createCampaignDraftForCurrentUser } from "@/lib/newsletters";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    newsletterSlug?: string;
    name?: string;
    subject?: string;
    previewText?: string;
    bodyHtml?: string;
    segmentId?: string;
  };

  if (!body.newsletterSlug || !body.name?.trim() || !body.subject?.trim() || !body.bodyHtml?.trim()) {
    return NextResponse.json(
      { error: "Newsletter, campaign name, subject, and body are required." },
      { status: 400 },
    );
  }

  try {
    const result = await createCampaignDraftForCurrentUser({
      newsletterSlug: body.newsletterSlug,
      name: body.name,
      subject: body.subject,
      previewText: body.previewText ?? "",
      bodyHtml: body.bodyHtml,
      segmentId: body.segmentId || undefined,
    });

    return NextResponse.json({
      message: "Campaign draft created.",
      campaign: result.campaign,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create campaign draft.",
      },
      { status: 500 },
    );
  }
}
