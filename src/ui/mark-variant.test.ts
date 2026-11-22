import { describe, expect, it } from "vitest";
import { markVariant } from "./mark-variant";

describe("markVariant", () => {
  it("chuỗi từ 2 ký tự trở lên vẽ vệt dày", () => {
    expect(markVariant("2 phút")).toBe("thick");
    expect(markVariant("học")).toBe("thick");
  });
  it("chuỗi 0 hoặc 1 ký tự chỉ vẽ gạch mỏng", () => {
    expect(markVariant("")).toBe("thin");
    expect(markVariant("  ")).toBe("thin");
    expect(markVariant("3")).toBe("thin");
    expect(markVariant("学")).toBe("thin");
  });
  it("dấu tách rời (NFD) vẫn tính là một ký tự", () => {
    expect(markVariant("ệ".normalize("NFD"))).toBe("thin");
  });
});
