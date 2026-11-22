"use client";

import { useEffect, useRef, useState } from "react";
import { isLowPower, prefersReducedMotion } from "@/ui/motion/env";

/**
 * Clip ngắn lặp, tắt tiếng, có poster. Không tải trước (`preload="none"`); chỉ phát khi gần khung
 * nhìn và tab đang hiện; dừng khi ra ngoài/tab ẩn. Reduced-motion hoặc máy yếu: chỉ hiện poster.
 * Có nút dừng/phát vì clip chạy quá 5 giây (WCAG 2.2.2).
 */
export function LoopVideo({
  src,
  poster,
  width,
  height,
  className,
}: {
  src: string;
  poster: string;
  width: number;
  height: number;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [stopped, setStopped] = useState(false);
  const inView = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAllowed(!prefersReducedMotion() && !isLowPower());
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v || !allowed) return;
    const sync = () => {
      if (inView.current && !stopped && document.visibilityState === "visible") {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    };
    const io = new IntersectionObserver(
      ([e]) => {
        inView.current = e.isIntersecting;
        sync();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(v);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      v.pause();
    };
  }, [allowed, stopped]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <video
        ref={ref}
        className="block h-full w-full object-cover"
        width={width}
        height={height}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        data-allowed={allowed ? "" : undefined}
      >
        {allowed ? <source src={src} type="video/mp4" /> : null}
      </video>
      {allowed ? (
        <button
          type="button"
          className="lp-video-btn press"
          aria-pressed={stopped}
          onClick={() => setStopped((s) => !s)}
        >
          {stopped ? "Phát video" : "Dừng video"}
        </button>
      ) : null}
    </div>
  );
}
