import { NextResponse } from "next/server";

import { createNewsletterForCurrentUser } from "@/lib/newsletters";

export async function POST(request: Request) {
  const { fullName, newsletterName, newsletterDescription } = (await request.json()) as {
    fullName?: string;
    newsletterName?: string;
    newsletterDescription?: string;
  };

  if (!fullName?.trim() || !newsletterName?.trim()) {
    return NextResponse.json(
      { error: "Full name and newsletter name are required." },
      { status: 400 },
    );
  }

  try {
    const newsletter = await createNewsletterForCurrentUser({
      fullName,
      newsletterName,
      newsletterDescription: newsletterDescription ?? "",
    });

    return NextResponse.json({
      message: "Your newsletter is ready.",
      newsletter,
      redirectTo: `/app/newsletters/${newsletter.slug}/settings`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to finish onboarding.",
      },
      { status: 500 },
    );
  }
}
