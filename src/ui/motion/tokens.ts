/**
 * Token chuyển động. Giá trị PHẢI khớp biến CSS trong motion.css (:root).
 * Dùng khi cần số trong JS (so le, thời lượng đếm); phần còn lại để CSS lo.
 */
export const EASE_OUT = "cubic-bezier(.22,1,.36,1)"; // phần tử đi vào (mặc định)
export const EASE_IN_OUT = "cubic-bezier(.65,0,.35,1)"; // clip-path, chuyển lớn
export const EASE_SPRING_SOFT = "cubic-bezier(.34,1.56,.64,1)"; // nảy nhẹ, dùng rất ít

export const DUR = { d1: 150, d2: 250, d3: 450, d4: 700 } as const; // ms

export const STAGGER_MS = 50; // trễ giữa hai phần tử liên tiếp
export const STAGGER_MAX = 6; // quá 6 phần tử thì dùng chung độ trễ cuối
export const SHIFT_PX = 24; // khoảng trượt; điện thoại 16px (đặt bằng CSS)
export const SHIFT_PX_MOBILE = 16;

/** Độ trễ (ms) của phần tử thứ `index` trong nhóm so le. */
export function staggerDelay(index: number): number {
  const i = Math.max(0, Math.min(Math.floor(index), STAGGER_MAX - 1));
  return i * STAGGER_MS;
}
