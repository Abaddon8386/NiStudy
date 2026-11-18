import { describe, expect, it } from "vitest";
import { localDateString, parseNumberInput, toRow, validateSettings } from "./settings";

const TODAY = "2026-11-18";
const NEW_ERR = "Mục tiêu thẻ mới phải từ 5 đến 30.";
const REV_ERR = "Giới hạn ôn phải từ 50 đến 500.";

describe("validateSettings", () => {
  it.each([4, 31, 5.5, NaN, 0, -1])("newPerDay %s bị từ chối", (v) => {
    expect(validateSettings({ newPerDay: v }, TODAY)).toEqual({ newPerDay: NEW_ERR });
  });
  it.each([5, 10, 30])("newPerDay %s hợp lệ", (v) => {
    expect(validateSettings({ newPerDay: v }, TODAY)).toEqual({});
  });
  it.each([49, 501, 100.5, NaN])("reviewLimit %s bị từ chối", (v) => {
    expect(validateSettings({ reviewLimit: v }, TODAY)).toEqual({ reviewLimit: REV_ERR });
  });
  it.each([50, 100, 500])("reviewLimit %s hợp lệ", (v) => {
    expect(validateSettings({ reviewLimit: v }, TODAY)).toEqual({});
  });
  it("ngày thi hôm qua bị từ chối, hôm nay và sau đó hợp lệ", () => {
    expect(validateSettings({ examDate: "2026-11-17" }, TODAY)).toEqual({ examDate: "Ngày thi phải từ hôm nay trở đi." });
    expect(validateSettings({ examDate: "2026-11-18" }, TODAY)).toEqual({});
    expect(validateSettings({ examDate: "2026-12-06" }, TODAY)).toEqual({});
  });
  it("xóa ngày thi luôn được", () => {
    expect(validateSettings({ examDate: null }, TODAY)).toEqual({});
  });
  it("ngày không có thật hoặc sai định dạng bị từ chối", () => {
    expect(validateSettings({ examDate: "2027-02-30" }, TODAY)).toEqual({ examDate: "Ngày thi không hợp lệ." });
    expect(validateSettings({ examDate: "18/11/2026" }, TODAY)).toEqual({ examDate: "Ngày thi không hợp lệ." });
  });
  it("chỉ kiểm các trường có mặt", () => {
    expect(validateSettings({ level: "N4" }, TODAY)).toEqual({});
    expect(validateSettings({ newPerDay: 3, reviewLimit: 10 }, TODAY)).toEqual({ newPerDay: NEW_ERR, reviewLimit: REV_ERR });
  });
});

describe("parseNumberInput", () => {
  it("số nguyên, số lẻ, rỗng, chữ", () => {
    expect(parseNumberInput(" 8 ")).toBe(8);
    expect(parseNumberInput("8.5")).toBe(8.5);
    expect(parseNumberInput("")).toBeNaN();
    expect(parseNumberInput("abc")).toBeNaN();
    expect(parseNumberInput("1e1")).toBeNaN();
  });
});

describe("toRow", () => {
  it("chỉ gửi các cột có trong patch, đổi sang snake_case", () => {
    expect(toRow({ newPerDay: 8 })).toEqual({ new_per_day: 8 });
    expect(toRow({ examDate: null })).toEqual({ exam_date: null });
    expect(toRow({ level: "N4", knowsKana: true, onboardedAt: "x" })).toEqual({
      level: "N4",
      knows_kana: true,
      onboarded_at: "x",
    });
  });
});

describe("localDateString", () => {
  it("định dạng YYYY-MM-DD theo ngày lịch địa phương", () => {
    expect(localDateString(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
