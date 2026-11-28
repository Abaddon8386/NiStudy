/** Phân tích chuỗi furigana dạng `漢字[かな]` (ADR-0009). Hàm thuần. */

export type RubySegment = { text: string } | { base: string; rt: string };

// Chữ Hán (kể cả 々 〆 ヶ) ngay trước dấu "[" là phần được chú âm.
const KANJI_RUN = /[㐀-䶿一-鿿豈-﫿々〆ヶ]+$/u;

/**
 * Tách thành đoạn chữ thường và đoạn chú âm. Ngoặc lỗi (không đóng, rỗng, không có chữ Hán đứng trước)
 * được giữ nguyên văn như chữ thường.
 */
export function parseRuby(input: string): RubySegment[] {
  const out: RubySegment[] = [];
  let plain = "";
  const flush = () => {
    if (plain) out.push({ text: plain });
    plain = "";
  };
  let i = 0;
  while (i < input.length) {
    const open = input.indexOf("[", i);
    if (open < 0) {
      plain += input.slice(i);
      break;
    }
    const close = input.indexOf("]", open + 1);
    const rt = close < 0 ? "" : input.slice(open + 1, close);
    const before = plain + input.slice(i, open);
    const m = KANJI_RUN.exec(before);
    if (close < 0 || !rt.trim() || rt.includes("[") || !m) {
      // Ngoặc lỗi: giữ nguyên "[" và tiếp tục sau nó.
      plain = before + "[";
      i = open + 1;
      continue;
    }
    plain = before.slice(0, before.length - m[0].length);
    flush();
    out.push({ base: m[0], rt });
    i = close + 1;
  }
  flush();
  return out;
}

/** Văn bản hiển thị khi ẩn furigana: chỉ phần gốc. */
export function rubyToBase(input: string): string {
  return parseRuby(input)
    .map((s) => ("text" in s ? s.text : s.base))
    .join("");
}

/** Văn bản dùng để phát âm: thay chữ Hán bằng cách đọc. */
export function rubyToReading(input: string): string {
  return parseRuby(input)
    .map((s) => ("text" in s ? s.text : s.rt))
    .join("");
}
