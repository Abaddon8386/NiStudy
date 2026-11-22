/**
 * Tra ngược âm Hán Việt -> chữ Nhật cho "thứ sống" ở trang giới thiệu.
 * Dữ liệu dựng lúc build từ data/build (KANJIDIC2 + JMdict + tanos), chỉ giữ phần đã duyệt:
 * âm Hán Việt chính và cách đọc. KHÔNG dùng nghĩa tiếng Việt (còn là nháp).
 */

/** [kanji, âm Hán Việt chính, cách đọc (on, nếu không có thì kun)] */
export type KanjiRow = [string, string, string];
/** [từ, cách đọc kana, âm Hán Việt ghép từng chữ] */
export type WordRow = [string, string, string];

export interface HanVietData {
  kanji: KanjiRow[];
  words: WordRow[];
}

export interface Hit {
  ja: string;
  reading: string;
  hv: string;
  kind: "kanji" | "word";
}

interface KanjiDetail {
  kanji: string;
  han_viet_main: string | null;
  on_readings: string[];
  kun_readings: string[];
}
interface VocabDetail {
  word: string;
  reading: string;
}

/** Dựng tập tra cứu: mọi kanji có âm Hán Việt và mọi từ vựng viết toàn bằng các kanji đó. */
export function buildHanVietData(kanji: KanjiDetail[], vocab: VocabDetail[]): HanVietData {
  const hv = new Map<string, string>();
  const rows: KanjiRow[] = [];
  for (const k of kanji) {
    if (!k.han_viet_main) continue;
    hv.set(k.kanji, k.han_viet_main);
    const reading = k.on_readings[0] ?? (k.kun_readings[0] ?? "").replace(/[.-]/g, "");
    rows.push([k.kanji, k.han_viet_main, reading]);
  }
  const words: WordRow[] = [];
  for (const v of vocab) {
    const chars = [...v.word];
    if (chars.length < 2 || !chars.every((c) => hv.has(c))) continue;
    words.push([v.word, v.reading, chars.map((c) => hv.get(c)).join(" ")]);
  }
  return { kanji: rows, words };
}

/** Chữ thường, NFC, gộp khoảng trắng. */
export function normalize(s: string): string {
  return s.normalize("NFC").toLowerCase().trim().replace(/\s+/g, " ");
}

/** Bỏ dấu tiếng Việt (để gõ "hoc sinh" vẫn ra 学生). */
export function fold(s: string): string {
  return normalize(s)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");
}

/** `q` có phải là một dãy âm liền nhau trong `hv` không (so theo âm, không theo ký tự). */
function containsSyllables(hv: string, q: string): boolean {
  return ` ${hv} `.includes(` ${q} `);
}

/**
 * Tìm tối đa `limit` kết quả. Thứ tự: khớp đúng có dấu, khớp đúng không dấu, chứa đủ âm có dấu,
 * chứa đủ âm không dấu. Cùng mức thì kanji đơn trước, rồi từ ngắn trước.
 */
export function lookup(data: HanVietData, query: string, limit = 6): Hit[] {
  const q = normalize(query);
  if (!q) return [];
  const qf = fold(q);
  const all: Hit[] = [
    ...data.kanji.map(([ja, hv, reading]) => ({ ja, reading, hv, kind: "kanji" as const })),
    ...data.words.map(([ja, reading, hv]) => ({ ja, reading, hv, kind: "word" as const })),
  ];
  const scored: { hit: Hit; score: number }[] = [];
  for (const hit of all) {
    const h = normalize(hit.hv);
    const hf = fold(h);
    const score =
      h === q ? 0 : hf === qf ? 1 : containsSyllables(h, q) ? 2 : containsSyllables(hf, qf) ? 3 : -1;
    if (score >= 0) scored.push({ hit, score });
  }
  scored.sort(
    (a, b) =>
      a.score - b.score ||
      (a.hit.kind === b.hit.kind ? 0 : a.hit.kind === "kanji" ? -1 : 1) ||
      [...a.hit.ja].length - [...b.hit.ja].length,
  );
  const seen = new Set<string>();
  const out: Hit[] = [];
  for (const { hit } of scored) {
    if (seen.has(hit.ja)) continue;
    seen.add(hit.ja);
    out.push(hit);
    if (out.length >= limit) break;
  }
  return out;
}
