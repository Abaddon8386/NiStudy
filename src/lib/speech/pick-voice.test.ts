import { describe, expect, it } from "vitest";
import { isJapaneseLang, pickJapaneseVoice, type VoiceLike } from "./pick-voice";

const v = (name: string, lang: string, localService = true, def = false): VoiceLike => ({
  name,
  lang,
  localService,
  default: def,
});

describe("pickJapaneseVoice", () => {
  it("không có giọng ja thì null", () => {
    expect(pickJapaneseVoice([])).toBeNull();
    expect(pickJapaneseVoice([v("A", "en-US"), v("B", "vi-VN")])).toBeNull();
  });
  it("nhận ja-JP, ja_JP, JA, không phân biệt hoa thường; không nhận 'jav'", () => {
    expect(pickJapaneseVoice([v("A", "ja_JP")])?.name).toBe("A");
    expect(pickJapaneseVoice([v("B", "JA-jp")])?.name).toBe("B");
    expect(pickJapaneseVoice([v("C", "ja")])?.name).toBe("C");
    expect(isJapaneseLang("jv-ID")).toBe(false);
  });
  it("ưu tiên giọng cục bộ hơn giọng mạng", () => {
    const r = pickJapaneseVoice([v("Net", "ja-JP", false, true), v("Local", "ja-JP", true, false)]);
    expect(r?.name).toBe("Local");
  });
  it("cùng cục bộ thì ưu tiên default; ngang nhau giữ thứ tự đầu", () => {
    expect(pickJapaneseVoice([v("A", "ja-JP"), v("B", "ja-JP", true, true)])?.name).toBe("B");
    expect(pickJapaneseVoice([v("A", "ja-JP"), v("B", "ja-JP")])?.name).toBe("A");
  });
  it("chỉ có giọng ja không cục bộ vẫn dùng", () => {
    expect(pickJapaneseVoice([v("Net", "ja-JP", false)])?.name).toBe("Net");
  });
});
