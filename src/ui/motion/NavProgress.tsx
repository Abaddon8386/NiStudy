"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "loading" | "done";

/** Tìm đường dẫn đích nếu click này là chuyển route nội bộ (cùng origin, tab hiện tại). */
function internalTarget(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return null;
  const url = new URL(a.href, location.href);
  return url.origin === location.origin ? url.pathname : null;
}

/**
 * Thanh tiến trình mảnh ở mép trên khi chuyển route (App Router): bắt đầu khi bấm link nội bộ,
 * kết thúc khi `usePathname` đổi. Trang trí (`aria-hidden`); tắt trong reduced-motion bằng CSS.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const current = useRef(pathname);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const to = internalTarget(e);
      if (to === null || to === current.current) return;
      clearTimeout(timer.current);
      setPhase("loading");
      // Chốt an toàn: điều hướng hỏng thì không để thanh treo mãi.
      timer.current = setTimeout(() => setPhase("idle"), 10_000);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (current.current === pathname) return;
    current.current = pathname;
    clearTimeout(timer.current);
    setPhase("done");
    timer.current = setTimeout(() => setPhase("idle"), 400);
  }, [pathname]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return <div aria-hidden="true" className="nav-progress" data-phase={phase} />;
}
