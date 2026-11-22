"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { splitWords } from "@/ui/motion/split";
import { passProgress, pinnedProgress, useScrollScene } from "./scroll";

const wide = () => matchMedia("(min-width: 1024px)").matches;

/**
 * Hero: từ 1024px, khung giữa câu là một cuộn phim dọc chạy theo cuộn trang trong khi hai nửa câu
 * đứng yên (sân khấu sticky). Điện thoại, reduced-motion, không JS: bố cục tĩnh.
 */
export function HeroStage({ frames, className, children }: { frames: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useScrollScene(
    ref,
    (el) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--p", pinnedProgress(r.top, r.height, innerHeight).toFixed(4));
    },
    wide,
  );
  return (
    <section ref={ref} className={className} style={{ "--n": frames } as CSSProperties} aria-labelledby="lp-title">
      {children}
    </section>
  );
}

/**
 * "Một ngày học" (từ 1024px): khung sticky, mỗi bước chiếm một màn cuộn. Đặt `data-step` (0..steps-1) để CSS
 * hiện bước đang tới. Điện thoại, reduced-motion, không JS: các bước xếp nối nhau, đọc đủ.
 */
export function StoryStage({
  steps,
  className,
  labelledBy,
  children,
}: {
  steps: number;
  className?: string;
  labelledBy: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useScrollScene(
    ref,
    (el) => {
      const stage = el.querySelector<HTMLElement>("[data-story-track]") ?? el;
      const r = stage.getBoundingClientRect();
      const p = pinnedProgress(r.top, r.height, innerHeight);
      el.style.setProperty("--p", p.toFixed(4));
      const step = String(Math.min(steps - 1, Math.floor(p * steps)));
      if (el.dataset.step !== step) el.dataset.step = step;
    },
    wide,
  );
  return (
    <section ref={ref} className={className} data-step="0" aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}

/**
 * Câu tuyên ngôn sáng dần theo từ khi cuộn qua (kiểu karaoke). Đã sáng thì giữ sáng.
 * Trình đọc màn hình nghe bản đầy đủ; reduced-motion/không JS: chữ đậm đủ ngay.
 */
export function ScrollRead({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const max = useRef(0);
  const words = splitWords(text);
  useScrollScene(ref, (el) => {
    const p = passProgress(el.getBoundingClientRect().top, innerHeight);
    if (p <= max.current) return;
    max.current = p;
    el.style.setProperty("--p", p.toFixed(4));
  });
  return (
    <p ref={ref} className={`lp-read ${className ?? ""}`} style={{ "--n": words.length } as CSSProperties}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <span key={`${i}-${w}`} style={{ "--i": i } as CSSProperties}>
            {w}{" "}
          </span>
        ))}
      </span>
    </p>
  );
}
