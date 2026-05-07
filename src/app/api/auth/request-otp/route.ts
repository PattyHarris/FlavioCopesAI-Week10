import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "OTP requested. Check your inbox and then use the verify screen.",
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
