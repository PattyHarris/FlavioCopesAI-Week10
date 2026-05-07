import { NextResponse } from "next/server";

import { createSignupFormForCurrentUser } from "@/lib/newsletters";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    newsletterSlug?: string;
    name?: string;
    heading?: string;
    description?: string;
    submitButtonLabel?: string;
    backgroundColor?: string;
    textColor?: string;
  };

  if (!body.newsletterSlug || !body.name?.trim() || !body.heading?.trim()) {
    return NextResponse.json(
      { error: "Newsletter, form name, and heading are required." },
      { status: 400 },
    );
  }

  try {
    const result = await createSignupFormForCurrentUser({
      newsletterSlug: body.newsletterSlug,
      name: body.name,
      heading: body.heading,
      description: body.description ?? "",
      submitButtonLabel: body.submitButtonLabel ?? "Subscribe",
      backgroundColor: body.backgroundColor ?? "#FFFFFF",
      textColor: body.textColor ?? "#212529",
    });

    return NextResponse.json({
      message: "Signup form created.",
      form: result.form,
      publicUrl: `/forms/${result.newsletter.slug}/${result.form.slug}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create signup form.",
      },
      { status: 500 },
    );
  }
}
