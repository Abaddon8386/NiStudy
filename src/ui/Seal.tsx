import type { CSSProperties } from "react";

/**
 * Dấu triện đỏ tròn có một chữ Nhật (Klee One). `stamp`: hiệu ứng đóng dấu một lần khi hiện
 * (reduced-motion tắt trong globals.css). Là trang trí (aria-hidden).
 */
export function Seal({
  char,
  size = 32,
  rotate = 0,
  stamp = false,
  className,
}: {
  char: string;
  size?: number;
  rotate?: number;
  stamp?: boolean;
  className?: string;
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.55),
    lineHeight: 1,
    transform: rotate ? `rotate(${rotate}deg)` : undefined,
    boxShadow: `inset 0 0 0 ${Math.max(2, Math.round(size / 16))}px var(--seal-edge)`,
  };
  return (
    <span
      aria-hidden="true"
      lang="ja"
      style={style}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-seal font-kanji font-semibold text-white ${stamp ? "stamp-in" : ""} ${className ?? ""}`}
    >
      {char}
    </span>
  );
}
