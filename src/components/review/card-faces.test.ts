import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SessionCard } from "@/lib/domain/queue";
import { CardBack, CardFront, exerciseFor } from "./card-faces";

const details = {
  point_id: "wa-desu",
  level: "N5",
  sort: 1,
  title: "AはBです",
  pattern: "N1 は N2 です",
  meaning_vi: "A là B",
  explanation: [],
  notes: [],
  examples: [{ ja: "私は学生です。", ruby: "私[わたし]は学生[がくせい]です。", vi: "Tôi là sinh viên." }],
  exercises: [
    { type: "cloze", prompt_ja: "私＿＿学生です。", answer: "は", choices: ["は", "が", "を", "に"], vi: "Tôi là sinh viên." },
  ],
};

const base = { card: { id: "grammar:wa-desu", kind: "grammar", level: "N5" }, details } as unknown as SessionCard;
const fresh: SessionCard = { ...base, state: null, isNew: true };
const learned: SessionCard = {
  ...base,
  state: { reps: 2 } as SessionCard["state"],
  isNew: false,
};
const front = (c: SessionCard) =>
  renderToStaticMarkup(createElement(CardFront, { card: c, flipRef: null, onFlip: () => {} }));

describe("mặt thẻ ngữ pháp", () => {
  it("thẻ mới: bài học ngắn có furigana rồi câu điền", () => {
    const html = front(fresh);
    expect(html).toContain("grammar-lesson");
    expect(html).toContain("<rt>わたし</rt>");
    expect(html).toContain("grammar-cloze");
    expect(html).toContain("Lật thẻ");
  });

  it("thẻ đã học: chỉ có câu điền và gợi ý nghĩa Việt, không có bài học", () => {
    const html = front(learned);
    expect(html).not.toContain("grammar-lesson");
    expect(html).toContain("grammar-cloze");
    expect(html).toContain("Gợi ý: Tôi là sinh viên.");
  });

  it("mặt sau: đáp án được Mark, có mẫu câu, nghĩa và liên kết tới bài", () => {
    const html = renderToStaticMarkup(createElement(CardBack, { card: learned }));
    expect(html).toContain('<span class="ui-mark"');
    expect(html).toContain(">は<");
    expect(html).toContain("N1 は N2 です");
    expect(html).toContain("A là B");
    expect(html).toContain('href="/ngu-phap/wa-desu"');
  });

  it("câu bài tập không đổi giữa mặt trước và mặt sau (reps giữ nguyên)", () => {
    expect(exerciseFor(learned, details as never)).toBe(exerciseFor({ ...learned }, details as never));
  });
});
