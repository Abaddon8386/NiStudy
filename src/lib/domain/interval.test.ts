import { describe, expect, it } from "vitest";
import { formatInterval } from "./interval";

const t0 = new Date("2026-11-18T10:00:00Z");
const after = (ms: number) => new Date(t0.getTime() + ms);
const MIN = 60_000;
const DAY = 86_400_000;

describe("formatInterval", () => {
  it("phút, giờ, ngày, tháng, năm", () => {
    expect(formatInterval(t0, after(20_000))).toBe("dưới 1 phút");
    expect(formatInterval(t0, after(10 * MIN))).toBe("10 phút");
    expect(formatInterval(t0, after(3 * 60 * MIN))).toBe("3 giờ");
    expect(formatInterval(t0, after(3 * DAY))).toBe("3 ngày");
    expect(formatInterval(t0, after(90 * DAY))).toBe("3 tháng");
    expect(formatInterval(t0, after(800 * DAY))).toBe("2 năm");
  });
  it("due trước from thì coi là 0", () => {
    expect(formatInterval(t0, after(-DAY))).toBe("dưới 1 phút");
  });
});
