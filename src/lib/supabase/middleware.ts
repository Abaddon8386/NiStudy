import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Làm mới phiên đăng nhập trong cookie (mẫu của @supabase/ssr).
 * Thiếu biến môi trường thì cho qua, không ném lỗi.
 * Không chuyển hướng ở đây: việc chặn trang cần đăng nhập làm ở giai đoạn sau.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = getSupabaseEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Kích hoạt làm mới token. Không chèn mã khác giữa createServerClient và getClaims.
  await supabase.auth.getClaims();

  return response;
}
