import type { ReactNode } from "react";

export type NoticeTone = "info" | "warn" | "success" | "error";

const TONE: Record<NoticeTone, { box: string; icon: string; glyph: string }> = {
  info: { box: "border-ring bg-sand text-ink", icon: "bg-ink text-paper", glyph: "i" },
  warn: { box: "border-marker bg-marker/25 text-ink", icon: "bg-marker text-ink", glyph: "!" },
  success: { box: "border-good bg-paper text-ink", icon: "bg-good text-white", glyph: "✓" },
  error: { box: "border-bad bg-paper text-bad", icon: "bg-bad text-white", glyph: "!" },
};

/**
 * Thông báo trong trang. Lỗi dùng role="alert" (đọc ngay), còn lại role="status".
 * Có biểu tượng chữ (vẽ bằng ::before, không lẫn vào nội dung đọc) để không chỉ dựa vào màu.
 */
export function Notice({
  tone = "info",
  role,
  className,
  children,
}: {
  tone?: NoticeTone;
  role?: "status" | "alert";
  className?: string;
  children: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div
      role={role ?? (tone === "error" ? "alert" : "status")}
      className={`flex items-start gap-3 rounded-[16px] border-2 px-4 py-3 text-base ${t.box} ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        data-glyph={t.glyph}
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[14px] leading-none font-bold before:content-[attr(data-glyph)] ${t.icon}`}
      />
      <div className="min-w-0 flex-1 font-medium">{children}</div>
    </div>
  );
}
