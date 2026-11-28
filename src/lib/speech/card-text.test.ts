import { describe, expect, it } from "vitest";
import type { SessionCard } from "@/lib/domain/queue";
import { speechTextForCard } from "./card-text";

const c = (kind: string, details: unknown) => ({ card: { id: "x", kind, level: null }, details }) as unknown as SessionCard;

describe("speechTextForCard", () => {
  it("kana phát chữ kana", () => {
    expect(speechTextForCard(c("kana", { kana: "あ", romaji: "a" }))).toBe("あ");
  });
  it("vocab phát cách đọc, không có thì phát từ", () => {
    expect(speechTextForCard(c("vocab", { word: "食べる", reading: "たべる" }))).toBe("たべる");
    expect(speechTextForCard(c("vocab", { word: "ありがとう", reading: "" }))).toBe("ありがとう");
  });
  it("kanji phát cách đọc từ ví dụ đầu; không có ví dụ thì null", () => {
    expect(speechTextForCard(c("kanji", { kanji: "学", examples: [{ word: "学生", reading: "がくせい" }] }))).toBe("がくせい");
    expect(speechTextForCard(c("kanji", { kanji: "学", examples: [] }))).toBeNull();
  });
  it("không có dữ liệu thì null", () => {
    expect(speechTextForCard(c("vocab", null))).toBeNull();
  });
  it("ngữ pháp phát câu hoàn chỉnh của bài tập, không có thì ví dụ đầu", () => {
    const ex = { type: "cloze", prompt_ja: "私＿＿学生です。", answer: "は", choices: [], vi: "" };
    expect(speechTextForCard(c("grammar", { exercises: [ex], examples: [] }))).toBe("私は学生です。");
    expect(
      speechTextForCard(c("grammar", { exercises: [], examples: [{ ja: "私は", ruby: "私[わたし]は", vi: "" }] })),
    ).toBe("わたしは");
    expect(speechTextForCard(c("grammar", { exercises: [], examples: [] }))).toBeNull();
  });
});
