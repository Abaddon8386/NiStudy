import type { GrammarExercise } from "@/lib/domain/queue";

/** FNV-1a 32 bit: băm chuỗi thành số không âm, ổn định giữa các lần chạy. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Chọn câu bài tập cho một lượt ôn. Seed = card_id + số lần ôn (`reps`): không đổi khi lật thẻ
 * (reps chỉ tăng sau khi chấm), nhưng khác nhau giữa các lần ôn. Danh sách rỗng trả null.
 */
export function pickExercise(
  cardId: string,
  reps: number,
  exercises: readonly GrammarExercise[],
): GrammarExercise | null {
  if (exercises.length === 0) return null;
  return exercises[hash(`${cardId}:${reps}`) % exercises.length];
}

/** Tách câu tại chỗ trống đầu tiên ("＿＿" hoặc "__"). `null` nếu không có chỗ trống. */
export function splitCloze(prompt: string): { before: string; after: string } | null {
  const m = /＿+|_{2,}/.exec(prompt);
  if (!m) return null;
  return { before: prompt.slice(0, m.index), after: prompt.slice(m.index + m[0].length) };
}

/** Câu hoàn chỉnh (điền đáp án vào chỗ trống). */
export function fillCloze(prompt: string, answer: string): string {
  const s = splitCloze(prompt);
  return s ? `${s.before}${answer}${s.after}` : prompt;
}

/**
 * Xáo thứ tự lựa chọn, ổn định theo seed (Fisher-Yates với mulberry32): cùng seed cho cùng thứ tự,
 * nên không đổi khi vẽ lại. Không sửa mảng gốc.
 */
export function shuffleChoices(seed: string, choices: readonly string[]): string[] {
  const out = [...choices];
  let a = hash(seed);
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
