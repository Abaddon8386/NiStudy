"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/Button";
import type { ButtonVariant } from "@/ui/button-styles";

/** Có phiên đăng nhập cục bộ không (getSession đọc bộ nhớ trình duyệt). Lỗi/thiếu cấu hình: coi như chưa. */
async function hasSession(): Promise<boolean> {
  try {
    const { data } = await createClient().auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let alive = true;
    hasSession().then((v) => alive && setSignedIn(v));
    return () => {
      alive = false;
    };
  }, []);
  return signedIn;
}

/**
 * Cặp nút hành động. Chưa đăng nhập (và khi chưa kiểm xong, kể cả không JS): "Bắt đầu học miễn phí"
 * tới /dang-ky và "Đăng nhập". Đã đăng nhập: một nút "Vào học" về trang chính.
 */
export function SessionCta({
  primary = "primary",
  secondary = "secondary",
  size = "lg",
  showSecondary = true,
  primaryLabel = "Bắt đầu học miễn phí",
  className,
}: {
  /** Nhãn nút chính khi chưa đăng nhập (thanh trên dùng nhãn ngắn). */
  primaryLabel?: string;
  primary?: ButtonVariant;
  secondary?: ButtonVariant;
  size?: "lg" | "md";
  showSecondary?: boolean;
  className?: string;
}) {
  const signedIn = useSignedIn();
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className ?? ""}`}>
      {signedIn ? (
        <Button href="/" variant={primary} size={size}>
          Vào học
        </Button>
      ) : (
        <>
          <Button href="/dang-ky" variant={primary} size={size}>
            {primaryLabel}
          </Button>
          {showSecondary ? (
            <Button href="/dang-nhap" variant={secondary} size={size}>
              Đăng nhập
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
