"use client";

import { Button } from "@/ui/Button";
import Link from "next/link";
import { AUTH_BACKDROP } from "@/components/media/japan-scenes";
import { AuthBackdrop } from "@/components/media/auth-backdrop";
import { Logo } from "@/ui/Logo";
import { Notice as UiNotice } from "@/ui/Notice";
import { PageHeader } from "@/ui/PageHeader";
import { fieldInputClass } from "@/ui/TextField";

/** Kiểu ô nhập dùng chung (còn dùng ở form hồ sơ). */
export const inputClass = fieldInputClass;

/**
 * Khung các màn đăng nhập/đăng ký: nền cảnh Nhật Bản phủ kín viewport (AuthBackdrop), form nằm trong
 * một thẻ giấy nổi (độ đục 0,95, bo 28px). Máy tính: thẻ rộng 440px lệch phải, căn giữa dọc; logo góc
 * trên trái, chú thích + nút tạm dừng góc dưới trái. Điện thoại: thẻ gần full ngang ở nửa dưới, để lộ
 * cảnh ở trên; chú thích nằm ngay trên thẻ.
 * `mark`: cụm trong `title` được bôi vàng; `lead`: dòng mô tả ngắn dưới tiêu đề.
 */
export function AuthShell({
  title,
  mark,
  lead,
  children,
}: {
  title: string;
  mark?: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <main id="noi-dung" tabIndex={-1} className="auth-page relative min-h-dvh overflow-x-clip">
      <AuthBackdrop scenes={AUTH_BACKDROP} />
      <Link
        href="/gioi-thieu"
        className="absolute top-3 left-3 z-10 inline-flex min-h-11 items-center rounded-full bg-paper py-1 pr-4 pl-1.5 shadow-sm lg:fixed lg:top-8 lg:left-8"
      >
        <Logo />
      </Link>
      <div className="relative z-[1] flex min-h-dvh flex-col px-2 pt-[38svh] pb-2 min-[480px]:px-5 lg:items-end lg:justify-center lg:px-[max(32px,7vw)] lg:py-16">
        <div
          className="auth-card mx-auto w-full max-w-[440px] rounded-[28px] px-4 py-7 min-[480px]:px-8 lg:mx-0 lg:px-9 lg:py-10"
        >
          <PageHeader title={title} mark={mark} meta={lead} />
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}

/** Liên kết nhỏ ở chân màn đăng nhập/đăng ký: giới thiệu và nguồn dữ liệu. */
export function SourceLink() {
  const cls = "text-[14px] font-normal text-ink-2 underline underline-offset-4";
  return (
    <p className="mt-6 flex flex-wrap justify-center gap-x-2">
      <Button href="/gioi-thieu" variant="ghost" className={cls}>
        Tìm hiểu Nihongo
      </Button>
      <Button href="/nguon-du-lieu" variant="ghost" className={cls}>
        Nguồn dữ liệu
      </Button>
    </p>
  );
}

/** Tương thích với các form chưa làm lại (hồ sơ): ánh xạ sang Notice mới. */
export function Notice({ kind, children }: { kind: "error" | "info"; children: React.ReactNode }) {
  return (
    <UiNotice tone={kind === "error" ? "error" : "info"} className="mt-4">
      {children}
    </UiNotice>
  );
}

/** Tương thích với các form chưa làm lại (hồ sơ): nút gửi lớn, primary. */
export function SubmitButton({
  pending,
  children,
  variant = "primary",
}: {
  pending: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Button type="submit" size="lg" variant={variant} loading={pending} className="mt-6 w-full">
      {children}
    </Button>
  );
}
