import { describe, expect, it } from "vitest";
import { fillCloze, pickExercise, shuffleChoices, splitCloze } from "./pick-exercise";
import type { GrammarExercise } from "@/lib/domain/queue";

const ex = (n: number): GrammarExercise => ({
  type: "cloze",
  prompt_ja: `問題${n}＿＿です。`,
  answer: "は",
  choices: ["は", "が", "を", "に"],
  vi: `câu ${n}`,
});
const list = [1, 2, 3, 4, 5, 6].map(ex);

describe("pickExercise", () => {
  it("ổn định với cùng card_id và reps", () => {
    expect(pickExercise("grammar:wa", 3, list)).toBe(pickExercise("grammar:wa", 3, list));
  });
  it("thay đổi giữa các lần ôn (đủ đa dạng)", () => {
    const seen = new Set<GrammarExercise | null>();
    for (let reps = 0; reps < 20; reps++) seen.add(pickExercise("grammar:wa", reps, list));
    expect(seen.size).toBeGreaterThan(2);
  });
  it("luôn là phần tử của danh sách; rỗng trả null", () => {
    for (let reps = 0; reps < 50; reps++) expect(list).toContain(pickExercise(`g:${reps}`, reps, list));
    expect(pickExercise("grammar:wa", 0, [])).toBeNull();
  });
});

describe("splitCloze / fillCloze", () => {
  it("tách và điền", () => {
    expect(splitCloze("私＿＿学生です。")).toEqual({ before: "私", after: "学生です。" });
    expect(fillCloze("私＿＿学生です。", "は")).toBe("私は学生です。");
  });
  it("không có chỗ trống", () => {
    expect(splitCloze("私は学生です。")).toBeNull();
    expect(fillCloze("私は学生です。", "は")).toBe("私は学生です。");
  });
});

describe("shuffleChoices", () => {
  const choices = ["は", "が", "を", "に"];
  it("ổn định theo seed và giữ nguyên tập lựa chọn, không sửa mảng gốc", () => {
    const a = shuffleChoices("wa-desu:0", choices);
    expect(shuffleChoices("wa-desu:0", choices)).toEqual(a);
    expect([...a].sort()).toEqual([...choices].sort());
    expect(choices).toEqual(["は", "が", "を", "に"]);
  });
  it("đáp án (đứng đầu trong dữ liệu) không luôn ở vị trí 0 và rải đều các vị trí", () => {
    const pos = new Set<number>();
    for (let i = 0; i < 40; i++) pos.add(shuffleChoices(`p${i}:${i % 5}`, choices).indexOf("は"));
    expect(pos.size).toBe(4);
  });
});
