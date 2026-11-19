import { describe, expect, it } from "vitest";
import { newCardState } from "./fsrs";
import { buildReview, cardStateFromJson, cardStateToJson } from "./review";

const now = new Date("2026-11-18T10:00:00.000Z");
const sessionId = "99999999-9999-4999-8999-999999999999";
const stateKeys = [
  "due", "stability", "difficulty", "elapsed_days", "scheduled_days",
  "learning_steps", "reps", "lapses", "state", "last_review",
].sort();

describe("buildReview", () => {
  it("thẻ mới: payload đủ khóa, tên cột snake_case", async () => {
    const { payload, nextState } = await buildReview({
      cardId: "vocab:1", stateBefore: null, rating: 3, now, sessionId, timeZone: "Asia/Ho_Chi_Minh",
    });
    expect(Object.keys(payload).sort()).toEqual([
      "card_id", "rating", "review_id", "reviewed_at", "session_id",
      "state_after", "state_before", "study_date",
    ]);
    expect(Object.keys(payload.state_after).sort()).toEqual(stateKeys);
    expect(Object.keys(payload.state_before).sort()).toEqual(stateKeys);
    expect(payload.card_id).toBe("vocab:1");
    expect(payload.rating).toBe(3);
    expect(payload.session_id).toBe(sessionId);
    expect(payload.reviewed_at).toBe("2026-11-18T10:00:00.000Z");
    expect(payload.state_before.state).toBe(0);
    expect(payload.state_after.reps).toBe(1);
    expect(payload.state_after.last_review).toBe(payload.reviewed_at);
    expect(new Date(payload.state_after.due).getTime()).toBeGreaterThan(now.getTime());
    expect(payload.state_after).toEqual(cardStateToJson(nextState));
  });

  it("review_id là uuid và khác nhau giữa các lần; có thể chỉ định", async () => {
    const base = { cardId: "vocab:1", stateBefore: null, rating: 3 as const, now, sessionId, timeZone: "UTC" };
    const a = await buildReview(base);
    const b = await buildReview(base);
    expect(a.payload.review_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(a.payload.review_id).not.toBe(b.payload.review_id);
    const c = await buildReview({ ...base, reviewId: "11111111-1111-4111-8111-111111111111" });
    expect(c.payload.review_id).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("study_date theo múi giờ và ranh giới 04:00 (FR-09)", async () => {
    // 20:30 UTC ngày 17 = 03:30 ngày 18 giờ Việt Nam: vẫn thuộc ngày học 17.
    const early = new Date("2026-11-17T20:30:00.000Z");
    const base = { cardId: "vocab:1", stateBefore: null, rating: 3 as const, sessionId };
    const vn = await buildReview({ ...base, now: early, timeZone: "Asia/Ho_Chi_Minh" });
    expect(vn.payload.study_date).toBe("2026-11-17");
    const after = await buildReview({
      ...base, now: new Date("2026-11-17T21:00:00.000Z"), timeZone: "Asia/Ho_Chi_Minh",
    });
    expect(after.payload.study_date).toBe("2026-11-18");
    const utc = await buildReview({ ...base, now: early, timeZone: "UTC" });
    expect(utc.payload.study_date).toBe("2026-11-17");
  });

  it("thẻ đã học: state_before phản ánh trạng thái cũ, lượt Again tăng lapses", async () => {
    const first = await buildReview({
      cardId: "vocab:1", stateBefore: null, rating: 4, now, sessionId, timeZone: "UTC",
    });
    const later = new Date(first.nextState.due.getTime() + 60_000);
    const second = await buildReview({
      cardId: "vocab:1", stateBefore: first.nextState, rating: 1, now: later, sessionId, timeZone: "UTC",
    });
    expect(second.payload.state_before).toEqual(first.payload.state_after);
    expect(second.payload.state_after.lapses).toBe(1);
    expect(second.payload.state_after.reps).toBe(2);
  });

  it("không đổi state đầu vào", async () => {
    const s = newCardState(now);
    const snap = structuredClone(s);
    await buildReview({ cardId: "kana:hira:a", stateBefore: s, rating: 2, now, sessionId, timeZone: "UTC" });
    expect(s).toEqual(snap);
  });
});

describe("cardStateToJson / cardStateFromJson", () => {
  it("khứ hồi, last_review null được giữ", () => {
    const s = newCardState(now);
    const j = cardStateToJson(s);
    expect(j.last_review).toBeNull();
    expect(cardStateFromJson(j)).toEqual(s);
    const withLast = { ...s, last_review: new Date("2026-11-17T01:02:03.000Z") };
    expect(cardStateFromJson(cardStateToJson(withLast))).toEqual(withLast);
  });
});
