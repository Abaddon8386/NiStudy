import { describe, expect, it } from "vitest";
import type { SessionCard } from "./queue";
import type { CardStateJson } from "./review";
import { advance, currentCard, isFinished, startSession, summarize } from "./session";

const st = (reps: number): CardStateJson => ({
  due: "2026-11-18T10:10:00.000Z", stability: 1, difficulty: 5, elapsed_days: 0,
  scheduled_days: 0, learning_steps: 1, reps, lapses: 0, state: 1, last_review: "2026-11-18T10:00:00.000Z",
});
const card = (id: string, isNew: boolean): SessionCard => ({
  card: { id, kind: "kana", level: null }, details: null, state: null, isNew,
});

describe("phiên ôn", () => {
  it("chấm Được: sang thẻ kế, không xếp lại; hết thẻ thì kết thúc", () => {
    let s = startSession([card("a", true)]);
    s = advance(s, 3, st(1));
    expect(isFinished(s)).toBe(true);
    expect(currentCard(s)).toBeNull();
    expect(s.cards).toHaveLength(1);
  });

  it("chấm Lại: xếp thẻ xuống cuối một lần với state mới, isNew=false", () => {
    let s = startSession([card("a", true), card("b", false)]);
    s = advance(s, 1, st(1));
    expect(s.cards.map((c) => c.card.id)).toEqual(["a", "b", "a"]);
    expect(s.cards[2].state).toEqual(st(1));
    expect(s.cards[2].isNew).toBe(false);
    s = advance(s, 3, st(1)); // b
    s = advance(s, 1, st(2)); // a lần 2: Lại nữa
    expect(s.cards).toHaveLength(3); // không xếp lần hai
    expect(isFinished(s)).toBe(true);
    expect(s.results.map((r) => [r.cardId, r.rating, r.isNew])).toEqual([
      ["a", 1, true], ["b", 3, false], ["a", 1, false],
    ]);
  });

  it("không đổi state đầu vào", () => {
    const s0 = startSession([card("a", false)]);
    advance(s0, 1, st(1));
    expect(s0.cards).toHaveLength(1);
    expect(s0.index).toBe(0);
  });

  it("summarize đếm theo mức chấm và thẻ mới", () => {
    const r = summarize([
      { cardId: "a", rating: 1, isNew: true },
      { cardId: "a", rating: 3, isNew: false },
      { cardId: "b", rating: 4, isNew: true },
    ]);
    expect(r).toEqual({ total: 3, newCards: 2, byRating: { 1: 1, 2: 0, 3: 1, 4: 1 } });
  });
});
