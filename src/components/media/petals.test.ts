import { describe, expect, it } from "vitest";
import { makePetal, stepPetal } from "./petals";
import { nextIndex } from "./auth-backdrop";

/** Bộ sinh số giả định trước để test lặp lại được. */
function seq(...xs: number[]) {
  let i = 0;
  return () => xs[i++ % xs.length];
}

describe("cánh hoa rơi", () => {
  it("cánh mới nằm trong khung; cánh sinh lại bắt đầu trên mép trên", () => {
    const p = makePetal(800, 600, seq(0.5));
    expect(p.x).toBe(400);
    expect(p.y).toBe(300);
    const top = makePetal(800, 600, seq(0.5), true);
    expect(top.y).toBeLessThan(0);
  });

  it("rơi xuống theo thời gian, không đổi vị trí ngang gốc", () => {
    const p = makePetal(800, 600, seq(0.5));
    const q = stepPetal(p, 1, 800, 600, seq(0.5));
    expect(q.y).toBeCloseTo(p.y + p.vy);
    expect(q.x).toBe(p.x);
  });

  it("ra khỏi đáy thì sinh lại trên đỉnh", () => {
    const p = { ...makePetal(800, 600, seq(0.5)), y: 640 };
    const q = stepPetal(p, 0.05, 800, 600, seq(0.2));
    expect(q.y).toBeLessThan(0);
  });
});

describe("chuỗi cảnh nền", () => {
  it("cảnh kế tiếp vòng lại từ đầu", () => {
    expect(nextIndex(0, 4)).toBe(1);
    expect(nextIndex(3, 4)).toBe(0);
  });
});
