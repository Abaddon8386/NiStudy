import { describe, expect, it } from "vitest";
import { buttonClasses, isInternalHref } from "./button-styles";

describe("buttonClasses", () => {
  it("primary là nền ink chữ trắng; onHero là nền vàng chỉ dành cho khối teal", () => {
    expect(buttonClasses("primary")).toContain("bg-ink text-paper");
    expect(buttonClasses("onHero")).toContain("bg-marker");
    expect(buttonClasses("primary")).not.toContain("bg-marker");
  });
  it("lg cao 56px, md cao 44px, đều bo tròn hết cỡ", () => {
    expect(buttonClasses("primary", "lg")).toContain("min-h-14");
    expect(buttonClasses("primary", "md")).toContain("min-h-11");
    expect(buttonClasses("ghost", "md")).toContain("rounded-full");
  });
  it("secondary viền 2px ink, danger viền và chữ bad", () => {
    expect(buttonClasses("secondary")).toContain("border-2 border-ink");
    expect(buttonClasses("danger")).toContain("border-bad");
    expect(buttonClasses("danger")).toContain("text-bad");
  });
  it("nối thêm class tùy chọn", () => {
    expect(buttonClasses("primary", "md", "w-full")).toMatch(/w-full$/);
  });
});

describe("isInternalHref", () => {
  it("phân biệt link nội bộ và ngoài", () => {
    expect(isInternalHref("/on-tap")).toBe(true);
    expect(isInternalHref("#noi-dung")).toBe(true);
    expect(isInternalHref("https://example.com")).toBe(false);
    expect(isInternalHref("mailto:a@b.c")).toBe(false);
  });
});
