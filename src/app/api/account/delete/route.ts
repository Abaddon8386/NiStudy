import { createClient as createAnonClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  checkRequestHeaders,
  classifyVerifyError,
  DELETE_STATUS,
  parseDeleteBody,
  type DeleteErrorCode,
} from "@/lib/account/validate";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(code: DeleteErrorCode, detail?: string) {
  // Log chỉ ghi mã lỗi, không ghi mật khẩu, email hay token.
  if (detail) console.error(`[account/delete] ${code}: ${detail}`);
  return NextResponse.json({ error: code }, { status: DELETE_STATUS[code], headers: { "Cache-Control": "no-store" } });
}

/** Xóa tài khoản (FR-05, ADR-0006): xác minh lại mật khẩu rồi xóa người dùng bằng service role. */
export async function POST(request: Request) {
  const headerErr = checkRequestHeaders(
    request.url,
    request.headers.get("origin"),
    request.headers.get("content-type"),
  );
  if (headerErr) return fail(headerErr);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("body");
  }
  const body = parseDeleteBody(json);
  if (!body) return fail("body");

  const supabase = await createClient();
  const { data, error: userErr } = await supabase.auth.getUser();
  const user = data.user;
  if (userErr || !user || !user.email) return fail("chua-dang-nhap");

  // Client anon riêng, không cookie: không chạm vào phiên hiện tại.
  const { url, anonKey } = requireSupabaseEnv();
  const verifier = createAnonClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: signed, error: verifyErr } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: body.password,
  });
  if (verifyErr) return fail(classifyVerifyError(verifyErr), verifyErr.code ?? String(verifyErr.status ?? ""));
  if (signed.user?.id !== user.id) return fail("sai-mat-khau");

  try {
    const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
    if (error) return fail("khong-xoa-duoc", error.code ?? String(error.status ?? ""));
  } catch (e) {
    return fail("khong-xoa-duoc", e instanceof Error ? e.message : "loi");
  }

  try {
    await supabase.auth.signOut();
  } catch {
    /* người dùng đã bị xóa; client tự đăng xuất cục bộ */
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
