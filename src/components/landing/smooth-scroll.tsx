"use client";

import { useEffect } from "react";
import { isLowPower, prefersReducedMotion } from "@/ui/motion/env";

/**
 * Cuộn mượt Lenis CHỈ cho trang giới thiệu. Không bật khi reduced-motion, màn cảm ứng
 * (`pointer: coarse`) hoặc máy yếu. Tải lười để không nằm trong bundle chung; hủy khi rời trang.
 */
export function SmoothScroll() {
  useEffect(() => {
    // Trình duyệt tự động (e2e, chụp ảnh) cuộn bằng lệnh: Lenis giữ đích cuộn cũ nên tắt ở đó.
    if (navigator.webdriver) return;
    if (prefersReducedMotion() || !matchMedia("(pointer: fine)").matches || isLowPower()) return;
    let destroyed = false;
    let lenis: { destroy(): void } | null = null;
    import("lenis").then(({ default: Lenis }) => {
      if (destroyed) return;
      lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        wheelMultiplier: 0.9,
        anchors: true,
        autoRaf: true,
      });
    });
    return () => {
      destroyed = true;
      lenis?.destroy();
    };
  }, []);
  return null;
}
