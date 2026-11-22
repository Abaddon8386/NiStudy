import { describe, expect, it } from "vitest";
import { bigKanjiSize } from "./big-kanji-size";

describe("bigKanjiSize", () => {
  it("một chữ dùng cỡ tối đa của từng chỗ", () => {
    expect(bigKanjiSize("学", "front")).toBe(160);
    expect(bigKanjiSize("学", "back")).toBe(96);
    expect(bigKanjiSize("学", "quiz")).toBe(144);
  });
  it("co lại khi từ dài hơn và không bao giờ vượt bề ngang 280px", () => {
    let prev = Infinity;
    for (let n = 1; n <= 10; n++) {
      const size = bigKanjiSize("あ".repeat(n), "front");
      expect(size).toBeLessThanOrEqual(prev);
      expect(size * n).toBeLessThanOrEqual(Math.max(280, 28 * n));
      prev = size;
    }
    expect(bigKanjiSize("新しい学生さん", "front")).toBe(40);
  });
  it("có tối thiểu 28px cho từ rất dài", () => {
    expect(bigKanjiSize("あ".repeat(30), "front")).toBe(28);
  });
  it("đếm theo ký tự hiển thị, không theo đơn vị UTF-16", () => {
    expect(bigKanjiSize("𠮷", "front")).toBe(160); // một ký tự ngoài BMP
  });
  it("chuỗi rỗng coi như một ký tự", () => {
    expect(bigKanjiSize("", "front")).toBe(160);
  });
});
