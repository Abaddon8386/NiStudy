import { NextResponse, type NextRequest } from "next/server";
import { CONFIRM_FAILED, planConfirm } from "@/lib/auth/confirm";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const plan = planConfirm(request.nextUrl.searchParams);

  if (plan.kind !== "fail") {
    try {
      const supabase = await createClient();
      const { error } =
        plan.kind === "verify_otp"
          ? await supabase.auth.verifyOtp({ type: plan.type, token_hash: plan.tokenHash })
          : await supabase.auth.exchangeCodeForSession(plan.code);
      if (!error) return NextResponse.redirect(new URL(plan.target, request.url));
    } catch {
      /* rơi xuống báo liên kết hết hạn */
    }
  }
  return NextResponse.redirect(new URL(CONFIRM_FAILED, request.url));
}
