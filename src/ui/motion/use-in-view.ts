"use client";

import { useEffect, useRef, useState } from "react";

export interface InViewOptions {
  /** Tỷ lệ phần tử phải thấy để tính là "vào khung nhìn". */
  threshold?: number;
  /** Mặc định co đáy 10%: phần tử hiện khi đã lên khỏi mép dưới một chút. */
  rootMargin?: string;
}

const DEFAULTS = { threshold: 0.15, rootMargin: "0px 0px -10% 0px" };

type Callback = () => void;
const observers = new Map<string, IntersectionObserver>();
const callbacks = new WeakMap<Element, Callback>();

/**
 * Quan sát `el` đúng một lần: khi vào khung nhìn thì gọi `cb` rồi `unobserve`.
 * Mọi phần tử cùng tùy chọn dùng CHUNG một IntersectionObserver. Trả về hàm hủy.
 */
export function observeOnce(el: Element, cb: Callback, opts: InViewOptions = {}): () => void {
  const { threshold, rootMargin } = { ...DEFAULTS, ...opts };
  const key = `${threshold}|${rootMargin}`;
  let io = observers.get(key);
  if (!io) {
    const created = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          created.unobserve(e.target);
          const fn = callbacks.get(e.target);
          callbacks.delete(e.target);
          fn?.();
        }
      },
      { threshold, rootMargin },
    );
    observers.set(key, created);
    io = created;
  }
  const shared = io;
  callbacks.set(el, cb);
  shared.observe(el);
  return () => {
    callbacks.delete(el);
    shared.unobserve(el);
  };
}

/** Trả `[ref, inView]`; `inView` chuyển true một lần rồi giữ nguyên. */
export function useInView<T extends Element>(opts: InViewOptions = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const { threshold, rootMargin } = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // Trình duyệt cũ: hiện ngay.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true);
      return;
    }
    return observeOnce(el, () => setInView(true), { threshold, rootMargin });
  }, [threshold, rootMargin]);

  return [ref, inView] as const;
}
