import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16: "middleware" đổi tên thành "proxy".
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Bỏ qua: tĩnh Next, ảnh tối ưu, service worker (/serwist/*), manifest, biểu tượng,
    // trang nguồn dữ liệu công khai và tệp có đuôi tĩnh.
    "/((?!_next/static|_next/image|serwist|manifest\.webmanifest|favicon\.ico|icons|nguon-du-lieu|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|json|txt|xml)$).*)",
  ],
};
