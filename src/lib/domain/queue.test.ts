import { describe, expect, it } from "vitest";
import sample from "../../../tests/fixtures/queue-sample.json";
import {
  buildSession,
  remainingNew,
  type CardKind,
  type KanaDetails,
  type DueItem,
  type NewCandidate,
  type TodayQueue,
} from "./queue";

function cand(kind: CardKind, n: number, kana?: Partial<KanaDetails>): NewCandidate {
  return {
    card: { id: `${kind}:${n}`, kind, level: kind === "kana" ? null : "N5" },
    details: kind === "kana" ? { script: "hira", kana: "あ", romaji: "a", grp: "basic", ...kana } : null,
  };
}
function list(kind: CardKind, count: number, kana?: Partial<KanaDetails>): NewCandidate[] {
  return Array.from({ length: count }, (_, i) => cand(kind, i + 1, kana));
}
/** Kana đã qua hiragana cơ bản: còn dakuten/katakana. */
const kanaLater = (count: number) => list("kana", count, { grp: "dakuten" });
const ids = (s: { card: { id: string } }[]) => s.map((c) => c.card.id);

const dueItem = (id: string): DueItem => ({
  card: { id, kind: "vocab", level: "N5" },
  details: null,
  state: {
    due: "2026-11-17T00:00:00Z",
    stability: 1,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 1,
    lapses: 0,
    state: 2,
    last_review: null,
  },
});

describe("remainingNew", () => {
  it("không âm", () => {
    expect(remainingNew(10, 4)).toBe(6);
    expect(remainingNew(10, 10)).toBe(0);
    expect(remainingNew(10, 15)).toBe(0);
  });
});

describe("buildSession", () => {
  it("thẻ đến hạn trước, giữ thứ tự, rồi thẻ mới", () => {
    const s = buildSession({
      due: [dueItem("vocab:9"), dueItem("vocab:3")],
      newCandidates: [cand("vocab", 1)],
      newDoneToday: 0,
      newPerDay: 10,
      knowsKana: true,
    });
    expect(ids(s)).toEqual(["vocab:9", "vocab:3", "vocab:1"]);
    expect(s.map((c) => c.isNew)).toEqual([false, false, true]);
    expect(s[0].state).not.toBeNull();
    expect(s[2].state).toBeNull();
  });

  it("xen kẽ 1 kanji : 2 vocab theo thứ tự đầu vào", () => {
    const s = buildSession({
      due: [],
      newCandidates: [...list("kanji", 2), ...list("vocab", 5)],
      newDoneToday: 0,
      newPerDay: 10,
      knowsKana: true,
    });
    expect(ids(s)).toEqual([
      "kanji:1", "vocab:1", "vocab:2",
      "kanji:2", "vocab:3", "vocab:4",
      "vocab:5",
    ]);
  });

  it("hết kanji thì lấy vocab, hết vocab thì lấy kanji", () => {
    const noKanji = buildSession({
      due: [], newCandidates: list("vocab", 4), newDoneToday: 0, newPerDay: 10, knowsKana: true,
    });
    expect(ids(noKanji)).toEqual(["vocab:1", "vocab:2", "vocab:3", "vocab:4"]);

    const noVocab = buildSession({
      due: [], newCandidates: list("kanji", 3), newDoneToday: 0, newPerDay: 10, knowsKana: true,
    });
    expect(ids(noVocab)).toEqual(["kanji:1", "kanji:2", "kanji:3"]);

    const fewVocab = buildSession({
      due: [],
      newCandidates: [...list("kanji", 3), ...list("vocab", 1)],
      newDoneToday: 0,
      newPerDay: 10,
      knowsKana: true,
    });
    expect(ids(fewVocab)).toEqual(["kanji:1", "vocab:1", "kanji:2", "kanji:3"]);
  });

  it("FR-13 giai đoạn 1: còn hiragana cơ bản thì thẻ mới chỉ là kana", () => {
    const s = buildSession({
      due: [],
      newCandidates: [...list("kana", 3), ...list("kanji", 2), ...list("vocab", 4)],
      newDoneToday: 0,
      newPerDay: 5,
      knowsKana: false,
    });
    expect(ids(s)).toEqual(["kana:1", "kana:2", "kana:3"]);
  });

  it("FR-13 giai đoạn 1: kana tính vào mục tiêu ngày", () => {
    const s = buildSession({
      due: [],
      newCandidates: [...list("kana", 8), ...list("vocab", 4)],
      newDoneToday: 3,
      newPerDay: 5,
      knowsKana: false,
    });
    expect(ids(s)).toEqual(["kana:1", "kana:2"]);
  });

  it("FR-13 giai đoạn 2: hết hiragana cơ bản thì xen 1 kana, 1 kanji, 2 vocab", () => {
    const s = buildSession({
      due: [],
      newCandidates: [...kanaLater(3), ...list("kanji", 2), ...list("vocab", 5)],
      newDoneToday: 0,
      newPerDay: 10,
      knowsKana: false,
    });
    expect(ids(s)).toEqual([
      "kana:1", "kanji:1", "vocab:1", "vocab:2",
      "kana:2", "kanji:2", "vocab:3", "vocab:4",
      "kana:3", "vocab:5",
    ]);
  });

  it("FR-13 giai đoạn 2: ứng viên kana đầu là katakana hoặc không rõ chi tiết cũng không còn là giai đoạn 1", () => {
    const kata = buildSession({
      due: [],
      newCandidates: [...list("kana", 2, { script: "kata" }), ...list("vocab", 2)],
      newDoneToday: 0,
      newPerDay: 10,
      knowsKana: false,
    });
    expect(ids(kata)).toEqual(["kana:1", "vocab:1", "vocab:2", "kana:2"]);
    const noDetails = buildSession({
      due: [],
      newCandidates: [{ ...cand("kana", 1), details: null }, ...list("vocab", 1)],
      newDoneToday: 0,
      newPerDay: 10,
      knowsKana: false,
    });
    expect(ids(noDetails)).toEqual(["kana:1", "vocab:1"]);
  });

  it("FR-13 giai đoạn 2: loại nào hết thì bỏ qua trong chu kỳ", () => {
    const noKanji = buildSession({
      due: [],
      newCandidates: [...kanaLater(2), ...list("vocab", 3)],
      newDoneToday: 0,
      newPerDay: 10,
      knowsKana: false,
    });
    expect(ids(noKanji)).toEqual(["kana:1", "vocab:1", "vocab:2", "kana:2", "vocab:3"]);

    const onlyKanaLeft = buildSession({
      due: [], newCandidates: kanaLater(3), newDoneToday: 0, newPerDay: 2, knowsKana: false,
    });
    expect(ids(onlyKanaLeft)).toEqual(["kana:1", "kana:2"]);

    const noKana = buildSession({
      due: [],
      newCandidates: [...list("kanji", 2), ...list("vocab", 2)],
      newDoneToday: 0,
      newPerDay: 10,
      knowsKana: false,
    });
    expect(ids(noKana)).toEqual(["kanji:1", "vocab:1", "vocab:2", "kanji:2"]);
  });

  it("đã biết kana: bỏ qua kana", () => {
    const s = buildSession({
      due: [],
      newCandidates: [...list("kana", 3), ...list("vocab", 2)],
      newDoneToday: 0,
      newPerDay: 10,
      knowsKana: true,
    });
    expect(ids(s)).toEqual(["vocab:1", "vocab:2"]);
  });

  it("chỉ lấy số còn lại = newPerDay - newDoneToday, không cắt thẻ đến hạn", () => {
    const s = buildSession({
      due: [dueItem("vocab:9")],
      newCandidates: [...list("kanji", 5), ...list("vocab", 5)],
      newDoneToday: 8,
      newPerDay: 10,
      knowsKana: true,
    });
    expect(ids(s)).toEqual(["vocab:9", "kanji:1", "vocab:1"]);
  });

  it("đã đủ mục tiêu: không có thẻ mới", () => {
    const s = buildSession({
      due: [dueItem("vocab:9")],
      newCandidates: list("vocab", 5),
      newDoneToday: 12,
      newPerDay: 10,
      knowsKana: true,
    });
    expect(ids(s)).toEqual(["vocab:9"]);
  });

  it("không đổi dữ liệu đầu vào", () => {
    const due = [dueItem("vocab:9")];
    const cands = list("vocab", 2);
    const before = structuredClone({ due, cands });
    buildSession({ due, newCandidates: cands, newDoneToday: 0, newPerDay: 10, knowsKana: true });
    expect({ due, cands }).toEqual(before);
  });

  it("khớp JSON mẫu của get_today_queue", () => {
    const q = sample as unknown as TodayQueue;
    const s = buildSession({
      due: q.due,
      newCandidates: q.new_candidates,
      newDoneToday: q.new_done_today,
      newPerDay: 5,
      knowsKana: false,
    });
    // còn hiragana cơ bản (giai đoạn 1 của FR-13): thẻ mới chỉ là kana
    expect(ids(s)).toEqual(["vocab:1", "kana:hira:i"]);
  });
});
