const nf = new Intl.NumberFormat("vi-VN");

/** Định dạng số kiểu Việt Nam: 1234 thành "1.234". */
export const formatCount = (n: number): string => nf.format(Math.round(n));

/** Easing out mũ (nhanh đầu, chậm cuối). t trong [0,1]. */
export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** Giá trị đếm tại thời điểm `elapsed` ms; tới hoặc quá `duration` thì đúng `to`. */
export function countAt(from: number, to: number, elapsed: number, duration: number): number {
  if (duration <= 0 || elapsed >= duration) return to;
  return from + (to - from) * easeOutExpo(Math.max(0, elapsed) / duration);
}
