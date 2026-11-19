import { NextResponse, type NextRequest } from "next/server";
import { planConfirm } from "@/lib/auth/confirm";
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
      // Chỉ ghi mã lỗi để chẩn đoán; không ghi code, token_hash hay cookie.
      console.warn("[auth/confirm] xác minh thất bại", {
        flow: plan.kind,
        code: error.code,
        name: error.name,
        status: error.status,
      });
    } catch (e) {
      console.warn("[auth/confirm] ngoại lệ khi xác minh", { flow: plan.kind, name: e instanceof Error ? e.name : "unknown" });
    }
  }
  return NextResponse.redirect(new URL(plan.onFail, request.url));
}
