"use client";

import { useEffect } from "react";
import { isLowPower } from "./env";

/**
 * Gắn `motion-ready` (và `low-power` nếu cần) lên <html> một lần sau khi JS chạy.
 * Trạng thái ẩn trong motion.css chỉ áp khi có lớp này, nên không JS thì nội dung vẫn hiện.
 * Đặt trong root layout. Không render gì.
 */
export function MotionBoot() {
  useEffect(() => {
    const root = document.documentElement;
    if (isLowPower()) root.classList.add("low-power");
    root.classList.add("motion-ready");
  }, []);
  return null;
}
