import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email, token } = (await request.json()) as { email?: string; token?: string };

  if (!email || !token) {
    return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "OTP verified. Session established for the current browser.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Supabase is not configured yet.",
      },
      { status: 500 },
    );
  }
}
