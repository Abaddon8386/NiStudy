"use client";

import { useState } from "react";
import "./marquee.css";

export interface MarqueeItem {
  ja: string;
  reading: string;
  vi: string;
}

/**
 * Dải chữ chạy: từ tiếng Nhật kèm cách đọc và nghĩa. Chạy liên tục nên có nút dừng (WCAG 2.2.2);
 * dừng cả khi rê chuột hoặc focus vào dải. Reduced-motion/không JS: đứng yên (CSS).
 * Bản thứ hai chỉ để nối vòng nên `aria-hidden`.
 */
export function Marquee({
  items,
  label,
  tone = "ink",
  paused: controlled,
  className,
}: {
  items: MarqueeItem[];
  label: string;
  tone?: "ink" | "teal";
  /** Truyền vào thì nút dừng nằm ở nơi khác (dải không tự vẽ nút). */
  paused?: boolean;
  className?: string;
}) {
  const [own, setOwn] = useState(false);
  const paused = controlled ?? own;
  const list = (hidden: boolean) => (
    <ul className="lp-marquee-list" aria-hidden={hidden || undefined} aria-label={hidden ? undefined : label}>
      {items.map((it) => (
        <li key={it.ja} className="lp-marquee-item">
          <span lang="ja" className="font-jp text-[1.15em] font-bold">
            {it.ja}
          </span>
          <span lang="ja" className="font-jp text-[0.7em] opacity-90">
            {it.reading}
          </span>
          <span className="text-[0.7em] font-medium">{it.vi}</span>
          <span aria-hidden="true" className="lp-marquee-dot" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`lp-marquee ${className ?? ""}`} data-tone={tone} data-paused={paused ? "" : undefined}>
      <div className="lp-marquee-viewport">
        <div className="lp-marquee-track">
          {list(false)}
          {list(true)}
        </div>
      </div>
      {controlled === undefined ? (
        <button type="button" className="lp-marquee-btn press" aria-pressed={paused} onClick={() => setOwn((v) => !v)}>
          {paused ? "Chạy chữ" : "Dừng chữ"}
        </button>
      ) : null}
    </div>
  );
}
