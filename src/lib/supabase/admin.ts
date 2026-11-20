import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client service role: CHỈ dùng trong Route Handler/máy chủ (NFR-13, ADR-0006).
 * Không log khóa; thiếu biến thì lỗi chỉ nêu tên biến.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Thiếu biến môi trường NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
