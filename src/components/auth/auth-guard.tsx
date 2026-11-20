"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearOutbox, hydrateOutbox } from "@/lib/learning/outbox";
import { createClient } from "@/lib/supabase/client";

/**
 * Chặn trang cần đăng nhập ở phía trình duyệt. Không chuyển hướng ở proxy vì vỏ ứng dụng được
 * service worker precache không có cookie. getSession() đọc phiên cục bộ nên chạy được khi offline.
 * Chưa kiểm xong thì không render nội dung (không lộ dữ liệu cá nhân).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        router.replace("/dang-nhap");
        return;
      }
      // Nạp lại lượt ôn chưa gửi của người dùng này từ IndexedDB và gửi (FR-27).
      void hydrateOutbox();
      if (navigator.onLine && pathname !== "/khoi-dau") {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("onboarded_at")
            .maybeSingle();
          if (cancelled) return;
          if (!error && profile && profile.onboarded_at === null) {
            router.replace("/khoi-dau");
            return;
          }
        } catch {
          /* lỗi mạng: vẫn hiện nội dung (offline) */
        }
      }
      if (!cancelled) setReady(true);
    }
    check().catch(() => {
      if (!cancelled) router.replace("/dang-nhap");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearOutbox();
        router.replace("/dang-nhap");
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (!ready) return <div aria-busy="true" className="min-h-dvh" />;
  return <>{children}</>;
}
