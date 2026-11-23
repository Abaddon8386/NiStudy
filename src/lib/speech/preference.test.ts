import { describe, expect, it } from "vitest";
import { AUTO_SPEAK_KEY, readAutoSpeak, writeAutoSpeak } from "./preference";

function memory(): Pick<Storage, "getItem" | "setItem"> & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}
const broken = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

describe("tùy chọn tự phát âm", () => {
  it("khóa đúng và mặc định tắt", () => {
    expect(AUTO_SPEAK_KEY).toBe("nihongo:auto-speak");
    expect(readAutoSpeak(memory())).toBe(false);
  });
  it("ghi rồi đọc lại", () => {
    const s = memory();
    expect(writeAutoSpeak(true, s)).toBe(true);
    expect(readAutoSpeak(s)).toBe(true);
    writeAutoSpeak(false, s);
    expect(readAutoSpeak(s)).toBe(false);
  });
  it("lỗi hoặc không có storage: không ném, đọc là tắt, ghi trả false", () => {
    expect(readAutoSpeak(broken)).toBe(false);
    expect(writeAutoSpeak(true, broken)).toBe(false);
    expect(readAutoSpeak(null)).toBe(false);
    expect(writeAutoSpeak(true, null)).toBe(false);
  });
});
