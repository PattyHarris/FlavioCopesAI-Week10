import { NextResponse } from "next/server";

import { subscribeToPublicForm } from "@/lib/public-forms";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      newsletterSlug: string;
      formSlug: string;
    }>;
  },
) {
  const { newsletterSlug, formSlug } = await context.params;
  const body = (await request.json()) as {
    email?: string;
    firstName?: string;
    lastName?: string;
  };

  if (!body.email?.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    await subscribeToPublicForm({
      newsletterSlug,
      formSlug,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
    });

    return NextResponse.json({
      message: "You are subscribed.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to subscribe right now.",
      },
      { status: 500 },
    );
  }
}
