"use client";

import { useEffect, type RefObject } from "react";
import { prefersReducedMotion } from "@/ui/motion/env";

/** Một vòng rAF dùng chung cho mọi cảnh theo cuộn của trang giới thiệu. */
const subs = new Set<() => void>();
let ticking = false;

function schedule() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    subs.forEach((fn) => fn());
  });
}

function subscribe(fn: () => void): () => void {
  if (subs.size === 0) {
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
  }
  subs.add(fn);
  fn();
  return () => {
    subs.delete(fn);
    if (subs.size === 0) {
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
    }
  };
}

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Tiến độ của một khối cao hơn màn hình: 0 khi đỉnh chạm đỉnh màn, 1 khi đáy chạm đáy màn. */
export function pinnedProgress(top: number, height: number, viewport: number): number {
  const span = height - viewport;
  return span <= 0 ? 0 : clamp01((0 - top) / span);
}

/** Tiến độ của một khối thường khi đi qua màn hình: 0 ở 85% chiều cao màn, 1 ở 25%. */
export function passProgress(top: number, viewport: number): number {
  return clamp01((viewport * 0.85 - top) / (viewport * 0.6));
}

/**
 * Gắn cảnh theo cuộn vào `ref`: khi được phép (không reduced-motion và `when()` đúng), đặt
 * `data-live` trên phần tử và gọi `onFrame(el)` mỗi khung khi cuộn. Không JS hoặc reduced-motion:
 * không làm gì, CSS giữ bố cục tĩnh đọc được đủ.
 */
export function useScrollScene<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onFrame: (el: T) => void,
  when: () => boolean = () => true,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !when()) return;
    el.dataset.live = "";
    const off = subscribe(() => onFrame(el));
    return () => {
      off();
      delete el.dataset.live;
    };
    // onFrame/when là hàm tĩnh của từng cảnh; chỉ gắn một lần.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}
