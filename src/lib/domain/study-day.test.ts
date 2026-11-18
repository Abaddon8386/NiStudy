import { describe, expect, it } from "vitest";
import { dayEnd, studyDate } from "./study-day";

const HCM = "Asia/Ho_Chi_Minh"; // UTC+7, không đổi giờ
const NY = "America/New_York";

/** Giờ địa phương Hồ Chí Minh -> Date UTC. */
const hcm = (iso: string) => new Date(`${iso}+07:00`);

describe("studyDate", () => {
  it("03:59 thuộc ngày hôm trước, 04:00 thuộc hôm nay", () => {
    expect(studyDate(hcm("2026-11-19T03:59:59"), HCM)).toBe("2026-11-18");
    expect(studyDate(hcm("2026-11-19T04:00:00"), HCM)).toBe("2026-11-19");
  });

  it("02:00 ngày 19 tính vào ngày 18", () => {
    expect(studyDate(hcm("2026-11-19T02:00:00"), HCM)).toBe("2026-11-18");
  });

  it("buổi chiều và 23:59 vẫn thuộc cùng ngày", () => {
    expect(studyDate(hcm("2026-11-19T15:30:00"), HCM)).toBe("2026-11-19");
    expect(studyDate(hcm("2026-11-19T23:59:59"), HCM)).toBe("2026-11-19");
  });

  it("qua năm mới: 02:00 ngày 1/1 thuộc ngày 31/12 năm trước", () => {
    expect(studyDate(hcm("2027-01-01T02:00:00"), HCM)).toBe("2026-12-31");
    expect(studyDate(hcm("2027-01-01T04:00:00"), HCM)).toBe("2027-01-01");
  });

  it("múi giờ có đổi giờ: America/New_York quanh 2026-03-08 (EST -> EDT lúc 02:00)", () => {
    // Đổi giờ xảy ra lúc 07:00Z ngày 8/3. Sau đó 04:00 EDT = 08:00Z.
    expect(studyDate(new Date("2026-03-08T07:59:00Z"), NY)).toBe("2026-03-07"); // 03:59 EDT
    expect(studyDate(new Date("2026-03-08T08:00:00Z"), NY)).toBe("2026-03-08"); // 04:00 EDT
    expect(studyDate(new Date("2026-03-07T08:59:00Z"), NY)).toBe("2026-03-06"); // 03:59 EST
    expect(studyDate(new Date("2026-03-07T09:00:00Z"), NY)).toBe("2026-03-07"); // 04:00 EST
  });

  it("múi giờ có đổi giờ: America/New_York quanh 2026-11-01 (EDT -> EST lúc 02:00)", () => {
    // 04:00 EST = 09:00Z; 03:59 EST = 08:59Z.
    expect(studyDate(new Date("2026-11-01T08:59:00Z"), NY)).toBe("2026-10-31");
    expect(studyDate(new Date("2026-11-01T09:00:00Z"), NY)).toBe("2026-11-01");
    // Giờ 01:30 xuất hiện hai lần, cả hai thuộc ngày học 31/10.
    expect(studyDate(new Date("2026-11-01T05:30:00Z"), NY)).toBe("2026-10-31"); // 01:30 EDT
    expect(studyDate(new Date("2026-11-01T06:30:00Z"), NY)).toBe("2026-10-31"); // 01:30 EST
  });
});

describe("dayEnd", () => {
  it("là 04:00 sáng hôm sau theo giờ địa phương (UTC)", () => {
    // 10:00 ngày 19 giờ HCM -> hết ngày học lúc 04:00 ngày 20 HCM = 21:00Z ngày 19.
    expect(dayEnd(hcm("2026-11-19T10:00:00"), HCM).toISOString()).toBe("2026-11-19T21:00:00.000Z");
  });

  it("lúc 02:00 ngày 19, ngày học là 18 nên hết ngày lúc 04:00 ngày 19", () => {
    expect(dayEnd(hcm("2026-11-19T02:00:00"), HCM).toISOString()).toBe("2026-11-18T21:00:00.000Z");
  });

  it("đúng 04:00 thì sang ngày học mới, hết ngày là 24 giờ sau", () => {
    expect(dayEnd(hcm("2026-11-19T04:00:00"), HCM).toISOString()).toBe("2026-11-19T21:00:00.000Z");
  });

  it("qua năm mới", () => {
    expect(dayEnd(hcm("2026-12-31T20:00:00"), HCM).toISOString()).toBe("2026-12-31T21:00:00.000Z");
    expect(dayEnd(hcm("2027-01-01T01:00:00"), HCM).toISOString()).toBe("2026-12-31T21:00:00.000Z");
  });

  it("America/New_York quanh đổi giờ mùa xuân 2026-03-08: ngày học 7/3 dài 23 giờ", () => {
    // Ngày học 7/3 bắt đầu 04:00 EST (09:00Z 7/3), kết thúc 04:00 EDT 8/3 (08:00Z).
    const end = dayEnd(new Date("2026-03-07T15:00:00Z"), NY);
    expect(end.toISOString()).toBe("2026-03-08T08:00:00.000Z");
  });

  it("America/New_York quanh đổi giờ mùa thu 2026-11-01: ngày học 31/10 dài 25 giờ", () => {
    const end = dayEnd(new Date("2026-10-31T15:00:00Z"), NY);
    expect(end.toISOString()).toBe("2026-11-01T09:00:00.000Z");
  });

  it("dayEnd luôn là ranh giới: studyDate tại dayEnd là ngày kế, 1ms trước vẫn là ngày cũ", () => {
    const now = new Date("2026-11-01T12:00:00Z");
    const end = dayEnd(now, NY);
    expect(studyDate(new Date(end.getTime() - 1), NY)).toBe(studyDate(now, NY));
    expect(studyDate(end, NY)).not.toBe(studyDate(now, NY));
  });
});
