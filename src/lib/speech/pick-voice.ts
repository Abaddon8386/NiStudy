/** Phần của `SpeechSynthesisVoice` mà logic chọn giọng cần (để test không phụ thuộc trình duyệt). */
export interface VoiceLike {
  lang: string;
  localService: boolean;
  default: boolean;
  name: string;
}

/** `ja-JP`, `ja_JP`, `JA`... đều tính là tiếng Nhật. */
export function isJapaneseLang(lang: string): boolean {
  return /^ja(?:[-_]|$)/i.test(lang.trim());
}

/**
 * Chọn giọng tiếng Nhật: ưu tiên giọng chạy trên máy (`localService`), rồi giọng mặc định; giữ thứ tự gốc khi ngang nhau.
 * Không có giọng ja thì trả null. Giọng không cục bộ vẫn được dùng vì nội dung chỉ là từ điển công khai (FR-C4).
 */
export function pickJapaneseVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  let best: T | null = null;
  let bestScore = -1;
  for (const v of voices) {
    if (!isJapaneseLang(v.lang)) continue;
    const score = (v.localService ? 2 : 0) + (v.default ? 1 : 0);
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return best;
}
