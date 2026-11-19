import { afterEach, describe, expect, it, vi } from "vitest";
import { countAt, formatCount } from "./count";
import { motionEnabled } from "./env";
import { splitWords } from "./split";
import { STAGGER_MAX, staggerDelay } from "./tokens";
import { observeOnce } from "./use-in-view";

describe("splitWords", () => {
  it("ghép lại đúng chuỗi, giữ dấu tiếng Việt, chuẩn hóa NFC", () => {
    const text = "Hôm nay: 28 thẻ, khoảng 10 phút";
    expect(splitWords(text).join(" ")).toBe(text);
    const decomposed = "Hôm nay đã xong".normalize("NFD");
    const out = splitWords(decomposed).join(" ");
    expect(out).toBe("Hôm nay đã xong".normalize("NFC"));
    expect(out.normalize("NFC")).toBe(out);
  });
  it("bỏ khoảng trắng thừa, chuỗi rỗng ra mảng rỗng", () => {
    expect(splitWords("  a   b ")).toEqual(["a", "b"]);
    expect(splitWords("")).toEqual([]);
  });
});

describe("CountUp (phần thuần)", () => {
  it("định dạng vi-VN", () => {
    expect(formatCount(1234)).toBe("1.234");
    expect(formatCount(1234567)).toBe("1.234.567");
    expect(formatCount(0.4)).toBe("0");
  });
  it("countAt: bắt đầu ở from, kết thúc đúng giá trị cuối, đơn điệu", () => {
    expect(countAt(0, 100, 0, 700)).toBe(0);
    expect(countAt(0, 100, 700, 700)).toBe(100);
    expect(countAt(0, 100, 9999, 700)).toBe(100);
    expect(countAt(0, 100, 100, 700)).toBeLessThan(countAt(0, 100, 300, 700));
    expect(countAt(0, 100, 5, 0)).toBe(100);
  });
});

describe("motionEnabled", () => {
  afterEach(() => vi.unstubAllGlobals());
  const stub = (ready: boolean, reduced: boolean) => {
    vi.stubGlobal("document", { documentElement: { classList: { contains: () => ready } } });
    vi.stubGlobal("matchMedia", () => ({ matches: reduced }));
  };
  it("reduced-motion thì tắt: CountUp hiện giá trị cuối ngay", () => {
    stub(true, true);
    expect(motionEnabled()).toBe(false);
  });
  it("chưa motion-ready thì tắt", () => {
    stub(false, false);
    expect(motionEnabled()).toBe(false);
  });
  it("sẵn sàng và không reduced thì bật", () => {
    stub(true, false);
    expect(motionEnabled()).toBe(true);
  });
});

describe("staggerDelay", () => {
  it("50ms mỗi bước, chặn ở 6 phần tử", () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(2)).toBe(100);
    expect(staggerDelay(50)).toBe((STAGGER_MAX - 1) * 50);
    expect(staggerDelay(-3)).toBe(0);
  });
});

describe("observeOnce", () => {
  type Cb = (entries: { target: Element; isIntersecting: boolean }[]) => void;
  afterEach(() => vi.unstubAllGlobals());

  it("một IntersectionObserver cho nhiều phần tử, unobserve sau khi hiện", () => {
    const created: { cb: Cb; observe: ReturnType<typeof vi.fn>; unobserve: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        constructor(cb: Cb) {
          created.push({ cb, observe: this.observe, unobserve: this.unobserve });
        }
      },
    );
    const a = {} as Element;
    const b = {} as Element;
    const onA = vi.fn();
    const onB = vi.fn();
    observeOnce(a, onA);
    observeOnce(b, onB);
    expect(created).toHaveLength(1);
    expect(created[0].observe).toHaveBeenCalledTimes(2);

    created[0].cb([{ target: a, isIntersecting: false }]);
    expect(onA).not.toHaveBeenCalled();

    created[0].cb([{ target: a, isIntersecting: true }]);
    expect(onA).toHaveBeenCalledTimes(1);
    expect(created[0].unobserve).toHaveBeenCalledWith(a);
    expect(onB).not.toHaveBeenCalled();

    // Gọi lại entry cũ không kích hoạt lần hai.
    created[0].cb([{ target: a, isIntersecting: true }]);
    expect(onA).toHaveBeenCalledTimes(1);
  });
});
