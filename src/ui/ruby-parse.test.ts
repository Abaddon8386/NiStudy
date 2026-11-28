import { describe, expect, it } from "vitest";
import { parseRuby, rubyToBase, rubyToReading } from "./ruby-parse";

describe("parseRuby", () => {
  it("chuỗi không có ngoặc là một đoạn chữ", () => {
    expect(parseRuby("これはペンです")).toEqual([{ text: "これはペンです" }]);
    expect(parseRuby("")).toEqual([]);
  });

  it("nhiều cụm xen chữ thường", () => {
    expect(parseRuby("私[わたし]は学生[がくせい]です。")).toEqual([
      { base: "私", rt: "わたし" },
      { text: "は" },
      { base: "学生", rt: "がくせい" },
      { text: "です。" },
    ]);
  });

  it("chỉ chữ Hán sát ngoặc được chú âm, kana đứng trước giữ nguyên", () => {
    expect(parseRuby("お金[かね]")).toEqual([{ text: "お" }, { base: "金", rt: "かね" }]);
  });

  it("ngoặc lỗi hiện nguyên văn", () => {
    expect(parseRuby("学生[がくせい")).toEqual([{ text: "学生[がくせい" }]);
    expect(parseRuby("学生[]です")).toEqual([{ text: "学生[]です" }]);
    expect(parseRuby("abc[かな]")).toEqual([{ text: "abc[かな]" }]);
    expect(parseRuby("学[が[く]")).toEqual([{ text: "学[が[く]" }]);
  });

  it("rubyToBase và rubyToReading", () => {
    const s = "私[わたし]は学生[がくせい]です";
    expect(rubyToBase(s)).toBe("私は学生です");
    expect(rubyToReading(s)).toBe("わたしはがくせいです");
    expect(rubyToBase("学生[がくせい")).toBe("学生[がくせい");
  });
});
