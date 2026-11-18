import { describe, expect, it } from "vitest";
import { grade, newCardState, type FsrsRating } from "./fsrs";

const now = new Date("2026-11-18T10:00:00.000Z");
const ratings: FsrsRating[] = [1, 2, 3, 4];

describe("fsrs", () => {
  it("thẻ mới: due tăng dần theo mức chấm Again <= Hard <= Good <= Easy", async () => {
    const card = newCardState(now);
    const dues: number[] = [];
    for (const r of ratings) {
      const { state } = await grade(card, r, now);
      expect(state.due.getTime()).toBeGreaterThan(now.getTime());
      dues.push(state.due.getTime());
    }
    expect(dues[0]).toBeLessThanOrEqual(dues[1]);
    expect(dues[1]).toBeLessThanOrEqual(dues[2]);
    expect(dues[2]).toBeLessThanOrEqual(dues[3]);
    expect(dues[3]).toBeGreaterThan(dues[0]);
  });

  it("grade thuần: không đổi đối tượng đầu vào, kết quả lặp lại được", async () => {
    const card = newCardState(now);
    const snapshot = structuredClone(card);
    const a = await grade(card, 3, now);
    const b = await grade(card, 3, now);
    expect(card).toEqual(snapshot);
    expect(a.state).toEqual(b.state);
    expect(a.state).not.toBe(card);
  });

  it("cập nhật reps, last_review, log và đúng các trường card_states", async () => {
    const { state, log } = await grade(newCardState(now), 3, now);
    expect(state.reps).toBe(1);
    expect(state.last_review).toEqual(now);
    expect(log).toMatchObject({ rating: 3, state_before: 0, reviewed_at: now });
    expect(Object.keys(state).sort()).toEqual(
      ["difficulty", "due", "elapsed_days", "lapses", "last_review", "learning_steps", "reps", "scheduled_days", "stability", "state"].sort(),
    );
  });

  it("chấm lần hai: elapsed_days tính từ last_review; Again khi đang ôn tăng lapses", async () => {
    const first = await grade(newCardState(now), 4, now);
    const later = new Date(first.state.due.getTime());
    const second = await grade(first.state, 1, later);
    expect(second.state.elapsed_days).toBeGreaterThanOrEqual(1);
    expect(second.state.reps).toBe(2);
    expect(second.state.lapses).toBe(1);
  });
});
