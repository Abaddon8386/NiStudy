import { describe, expect, it } from "vitest";
import { buildQuiz, scoreQuiz, type QuizCard, type QuizQuestion } from "./quiz";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const vocab = (i: number, over: Partial<QuizCard> = {}): QuizCard => ({
  id: `vocab:${i}`,
  kind: "vocab",
  level: "N5",
  text: `語${i}`,
  reading: `ご${i}`,
  meaningVi: `nghĩa ${i}`,
  hanViet: null,
  ...over,
});
const kanji = (i: number, over: Partial<QuizCard> = {}): QuizCard => ({
  id: `kanji:${i}`,
  kind: "kanji",
  level: "N5",
  text: `漢${i}`,
  reading: null,
  meaningVi: null,
  hanViet: `âm${i}`,
  ...over,
});

const pool = [...Array.from({ length: 30 }, (_, i) => vocab(i)), ...Array.from({ length: 15 }, (_, i) => kanji(i))];
const learned = [...pool.slice(0, 8), ...pool.slice(30, 35)];

function build(seed = 1, l = learned, p = pool) {
  const r = buildQuiz(l, p, mulberry32(seed));
  if (!r.ok) throw new Error("expected ok");
  return r.questions;
}

describe("buildQuiz", () => {
  it("đủ 10 câu khi đủ dữ liệu, mỗi thẻ một câu", () => {
    const qs = build();
    expect(qs).toHaveLength(10);
    expect(new Set(qs.map((q) => q.cardId)).size).toBe(10);
    for (const q of qs) expect(learned.map((c) => c.id)).toContain(q.cardId);
  });

  it("mỗi câu có đúng 4 lựa chọn, 1 đáp án, không trùng hiển thị", () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const q of build(seed)) {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options.map((o) => o.toLowerCase())).size).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
      }
    }
  });

  it("đáp án đúng khớp thẻ hỏi theo từng dạng; Hán Việt viết HOA", () => {
    const byId = new Map(pool.map((c) => [c.id, c]));
    const types = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      for (const q of build(seed)) {
        const c = byId.get(q.cardId)!;
        types.add(q.type);
        const right = q.options[q.correctIndex];
        if (q.type === "vocab-meaning") {
          expect(q.prompt).toBe(c.text);
          expect(q.promptReading).toBe(c.reading);
          expect(right).toBe(c.meaningVi);
        } else if (q.type === "vocab-word") {
          expect(q.prompt).toBe(c.meaningVi);
          expect(q.promptReading).toBeNull();
          expect(q.optionsAreJapanese).toBe(true);
          expect(right).toBe(c.text);
        } else {
          expect(q.prompt).toBe(c.text);
          expect(right).toBe(c.hanViet!.toUpperCase());
          expect(q.options.every((o) => o === o.toUpperCase())).toBe(true);
        }
      }
    }
    expect([...types].sort()).toEqual(["kanji-hanviet", "vocab-meaning", "vocab-word"]);
  });

  it("đáp án nhiễu cùng level (N5) với thẻ hỏi, không lấy thẻ N4", () => {
    const n4 = Array.from({ length: 10 }, (_, i) => vocab(100 + i, { level: "N4", text: `四${i}`, meaningVi: `bốn ${i}` }));
    const n5 = Array.from({ length: 10 }, (_, i) => vocab(i));
    for (let seed = 1; seed <= 10; seed++) {
      for (const q of build(seed, n5, [...n5, ...n4])) {
        for (const o of q.options) expect(o.startsWith("四") || o.startsWith("bốn")).toBe(false);
      }
    }
    // Ngược lại thẻ N4 hỏi chỉ nhận nhiễu N4.
    for (const q of build(3, n4, [...n5, ...n4])) {
      for (const o of q.options) expect(o.startsWith("語") || o.startsWith("nghĩa")).toBe(false);
    }
  });

  it("không dùng thẻ khác kind làm nhiễu", () => {
    const ks = Array.from({ length: 10 }, (_, i) => kanji(i, { hanViet: `K${i}` }));
    const p = [...ks, ...Array.from({ length: 10 }, (_, i) => vocab(i))];
    for (const q of build(3, ks, p)) {
      expect(q.options.every((o) => /^K\d+$/.test(o))).toBe(true);
    }
  });

  it("loại đồng nghĩa trùng chuỗi: không có hai lựa chọn giống nhau", () => {
    // Mọi thẻ có cùng nghĩa (khác hoa/thường, khoảng trắng): dạng từ → nghĩa không có nhiễu khác nghĩa.
    const syn = Array.from({ length: 12 }, (_, i) => vocab(i, { meaningVi: i % 2 === 0 ? "ăn" : "Ăn " }));
    for (const q of build(5, syn, syn)) {
      expect(q.type).toBe("vocab-word");
      expect(new Set(q.options).size).toBe(4);
    }
  });

  it("thiếu dữ liệu: trả lý do và số câu hiện có", () => {
    const r = buildQuiz(learned.slice(0, 6), pool, mulberry32(1));
    expect(r).toEqual({ ok: false, reason: "not-enough", available: 6 });
  });

  it("không đủ nhiễu thì không tạo câu cho thẻ đó", () => {
    const small = [vocab(0), vocab(1), vocab(2)]; // chỉ có 2 nhiễu
    expect(buildQuiz(small, small, mulberry32(1))).toEqual({ ok: false, reason: "not-enough", available: 0 });
  });

  it("bỏ thẻ thiếu giá trị cần thiết", () => {
    const l = [
      ...Array.from({ length: 9 }, (_, i) => vocab(i)),
      vocab(50, { meaningVi: null, text: null }),
      kanji(50, { hanViet: null }),
      kanji(51, { hanViet: "  " }),
    ];
    expect(buildQuiz(l, [...pool, ...l], mulberry32(2))).toEqual({ ok: false, reason: "not-enough", available: 9 });
  });

  it("thẻ thiếu giá trị không bị dùng làm nhiễu", () => {
    const broken = Array.from({ length: 3 }, (_, i) => vocab(200 + i, { meaningVi: null }));
    for (const q of build(4, learned, [...pool, ...broken])) {
      for (const o of q.options) expect(o).not.toBe("");
    }
  });

  it("rng tất định: cùng seed ra cùng bài, khác seed ra bài khác", () => {
    expect(build(7)).toEqual(build(7));
    expect(build(7)).not.toEqual(build(8));
  });
});

describe("scoreQuiz", () => {
  const q = (correctIndex: number): QuizQuestion => ({
    cardId: "c",
    type: "vocab-meaning",
    prompt: "x",
    promptReading: null,
    promptIsJapanese: true,
    optionsAreJapanese: false,
    options: ["a", "b", "c", "d"],
    correctIndex,
  });
  it("đếm đúng, liệt kê câu sai, chưa trả lời tính sai", () => {
    const qs = [q(0), q(1), q(2), q(3)];
    const s = scoreQuiz(qs, [0, 0, 2, null]);
    expect(s.correct).toBe(2);
    expect(s.total).toBe(4);
    expect(s.wrong.map((w) => w.chosen)).toEqual([0, null]);
    expect(s.wrong[0].question).toBe(qs[1]);
  });
});
