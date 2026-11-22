import { describe, expect, it } from "vitest";
import kanji from "../../../data/build/kanji_details.json";
import vocab from "../../../data/build/vocab_details.json";
import { buildHanVietData, fold, lookup, normalize, type HanVietData } from "./hanviet";

const data = buildHanVietData(kanji, vocab);

describe("buildHanVietData", () => {
  it("chỉ giữ từ viết toàn bằng kanji có âm Hán Việt, ghép âm theo từng chữ", () => {
    const hs = data.words.find(([w]) => w === "学生");
    expect(hs).toEqual(["学生", "がくせい", "Học Sinh"]);
    // Từ có kana (友達 có 達 ngoài danh sách, あそこ là kana) bị loại.
    expect(data.words.some(([w]) => w === "あそこ")).toBe(false);
    expect(data.words.every(([w]) => [...w].length >= 2)).toBe(true);
  });

  it("không mang nghĩa tiếng Việt (nháp) vào dữ liệu trang công khai", () => {
    expect(JSON.stringify(data)).not.toContain("đằng kia");
  });

  it("đọc on của kanji, thiếu on thì dùng kun bỏ dấu chấm", () => {
    const small: HanVietData = buildHanVietData(
      [
        { kanji: "学", han_viet_main: "Học", on_readings: ["ガク"], kun_readings: ["まな.ぶ"] },
        { kanji: "畑", han_viet_main: "Điền", on_readings: [], kun_readings: ["はた.け"] },
        { kanji: "〆", han_viet_main: null, on_readings: [], kun_readings: [] },
      ],
      [],
    );
    expect(small.kanji).toEqual([
      ["学", "Học", "ガク"],
      ["畑", "Điền", "はたけ"],
    ]);
  });
});

describe("normalize/fold", () => {
  it("chuẩn hóa NFC, chữ thường, gộp khoảng trắng; fold bỏ dấu và đ", () => {
    expect(normalize("  Học   SINH ".normalize("NFD"))).toBe("học sinh");
    expect(fold("Đại Học")).toBe("dai hoc");
  });
});

describe("lookup", () => {
  it("khớp đúng cả từ trước, rồi mới tới từ chứa âm đó", () => {
    expect(lookup(data, "học sinh")[0]).toMatchObject({ ja: "学生", reading: "がくせい", kind: "word" });
  });

  it("một âm: kanji đơn đứng đầu, sau đó các từ chứa âm", () => {
    const hits = lookup(data, "Học");
    expect(hits[0]).toMatchObject({ ja: "学", kind: "kanji", reading: "ガク" });
    expect(hits.map((h) => h.ja)).toEqual(expect.arrayContaining(["学校", "大学"]));
    expect(hits.length).toBeLessThanOrEqual(6);
  });

  it("gõ không dấu vẫn ra, nhưng sau kết quả có dấu", () => {
    expect(lookup(data, "hoc sinh")[0].ja).toBe("学生");
    expect(lookup(data, "dai hoc")[0].ja).toBe("大学");
  });

  it("so theo âm, không theo ký tự: 'sin' không khớp 'sinh'", () => {
    expect(lookup(data, "sin")).toEqual([]);
  });

  it("rỗng hoặc không có thì trả mảng rỗng; không trùng chữ", () => {
    expect(lookup(data, "   ")).toEqual([]);
    expect(lookup(data, "xyz")).toEqual([]);
    const hits = lookup(data, "nhật", 20);
    expect(new Set(hits.map((h) => h.ja)).size).toBe(hits.length);
  });
});
