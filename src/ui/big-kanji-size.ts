export type BigKanjiVariant = "front" | "back" | "quiz";

/** Cỡ tối đa và bề ngang khả dụng (px, điện thoại 375) của từng chỗ dùng. */
const CONFIG: Record<BigKanjiVariant, { max: number; avail: number }> = {
  front: { max: 160, avail: 280 },
  back: { max: 96, avail: 280 },
  quiz: { max: 144, avail: 280 },
};

/**
 * Cỡ chữ (px, chuẩn điện thoại) co theo số ký tự để cả từ vừa một dòng trong bề ngang khả dụng.
 * Máy tính nhân thêm 1,25 bằng CSS (BigKanji). Làm tròn xuống bội số của 4, tối thiểu 28.
 */
export function bigKanjiSize(text: string, variant: BigKanjiVariant = "front"): number {
  const len = Math.max(1, Array.from(text.normalize("NFC")).length);
  const { max, avail } = CONFIG[variant];
  return Math.max(28, Math.min(max, Math.floor(avail / len / 4) * 4));
}
