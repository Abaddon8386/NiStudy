"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { countAt, formatCount } from "./count";
import { motionEnabled } from "./env";
import { DUR } from "./tokens";
import { useInView } from "./use-in-view";

interface CountUpProps {
  value: number;
  /** ms, tối đa 700. */
  duration?: number;
  className?: string;
}

/**
 * Đếm từ 0 tới `value` khi vào khung nhìn (rAF, easing out). SSR/không JS/reduced-motion hiện ngay
 * giá trị cuối. Trình đọc màn hình chỉ nghe giá trị cuối; phần chạy là `aria-hidden`.
 * Giá trị đổi về sau thì cập nhật ngay, không đếm lại.
 */
export function CountUp({ value, duration = DUR.d4, className }: CountUpProps) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState(value);
  // static: hiện thẳng giá trị; waiting: đã hạ về 0 chờ vào khung nhìn; ran: đã chạy.
  const mode = useRef<"static" | "waiting" | "ran">("static");

  // Trước lần vẽ đầu: nếu sẽ đếm thì đặt 0 để không nháy giá trị cuối.
  useLayoutEffect(() => {
    if (motionEnabled()) {
      mode.current = "waiting";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(0);
    }
  }, []);

  useEffect(() => {
    if (mode.current !== "waiting") {
      setShown(value);
      return;
    }
    if (!inView) return;
    mode.current = "ran";
    const dur = Math.min(duration, DUR.d4);
    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      t0 ||= t;
      setShown(countAt(0, value, t - t0, dur));
      if (t - t0 < dur) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      <span className="sr-only">{formatCount(value)}</span>
      <span aria-hidden="true">{formatCount(shown)}</span>
    </span>
  );
}
