import { describe, expect, it } from "vitest";
import fixture from "../../../tests/fixtures/streak-xp.json";
import { computeStreak, totalDays } from "./streak";

describe("streak (fixture dùng chung với SQL)", () => {
  for (const c of fixture.cases) {
    it(c.name, () => {
      expect(computeStreak(c.reviewDates, fixture.today)).toBe(c.expected.streak);
      expect(totalDays(c.reviewDates)).toBe(c.expected.total_days);
    });
  }

  it("bỏ qua ngày trong tương lai", () => {
    expect(computeStreak(["2026-11-20", "2026-11-19"], "2026-11-19")).toBe(1);
  });

  it("qua ranh giới tháng và năm", () => {
    expect(computeStreak(["2026-12-31", "2027-01-01", "2027-01-02"], "2027-01-02")).toBe(3);
  });
});
