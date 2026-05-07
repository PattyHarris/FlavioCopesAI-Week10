import { NextResponse } from "next/server";

import { createSegmentForCurrentUser, type SegmentRule } from "@/lib/newsletters";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    newsletterSlug?: string;
    name?: string;
    description?: string;
    rules?: SegmentRule[];
  };

  if (!body.newsletterSlug || !body.name?.trim()) {
    return NextResponse.json(
      { error: "Newsletter and segment name are required." },
      { status: 400 },
    );
  }

  try {
    const result = await createSegmentForCurrentUser({
      newsletterSlug: body.newsletterSlug,
      name: body.name,
      description: body.description ?? "",
      rules: body.rules ?? [],
    });

    return NextResponse.json({
      message: "Segment created.",
      segment: result.segment,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create segment.",
      },
      { status: 500 },
    );
  }
}
