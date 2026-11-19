/** Phát hiện môi trường chuyển động. Chỉ gọi trong trình duyệt (effect, handler). */

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Máy yếu: cảm ứng + màn hẹp, hoặc ≤4 nhân CPU, hoặc ≤4 GB RAM (cùng ngưỡng ximitech.vn).
 * `deviceMemory` chưa có trong lib.dom nên đọc qua kiểu mở rộng.
 */
export function isLowPower(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const touchSmall = typeof matchMedia === "function" && matchMedia("(pointer:coarse) and (max-width:767px)").matches;
  const fewCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  const lowMem = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  return touchSmall || fewCores || lowMem;
}

/** Có nên chạy chuyển động bằng JS (đếm số): đã `motion-ready` và người dùng không tắt chuyển động. */
export function motionEnabled(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("motion-ready") && !prefersReducedMotion();
}
