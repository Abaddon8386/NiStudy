import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { speak } from "./speak";

class FakeUtterance {
  text: string;
  lang = "";
  rate = 1;
  voice: unknown = null;
  onend?: () => void;
  onerror?: () => void;
  constructor(text: string) {
    this.text = text;
  }
}

let spoken: FakeUtterance[];
let cancels: number;

beforeEach(() => {
  spoken = [];
  cancels = 0;
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  // cancel() thật không bắn sự kiện đồng bộ; sự kiện đến muộn được test mô phỏng bằng tay.
  vi.stubGlobal("window", {
    speechSynthesis: { speak: (u: FakeUtterance) => spoken.push(u), cancel: () => void cancels++ },
  });
  // Mỗi test kết thúc lượt còn treo để module không giữ trạng thái giữa các test.
  speak("", null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("speak", () => {
  it("phát ja-JP và gọi onEnd đúng một lần khi onend (kể cả onerror đến sau)", () => {
    const onEnd = vi.fn();
    speak("あ", null, { onEnd });
    expect(spoken[0].lang).toBe("ja-JP");
    expect(onEnd).not.toHaveBeenCalled();
    spoken[0].onend?.();
    spoken[0].onerror?.();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("bấm cùng nút hai lần: lượt đầu kết thúc ngay (đồng bộ), lượt hai vẫn đang phát, sự kiện muộn của lượt đầu bị bỏ", () => {
    const first = vi.fn();
    const second = vi.fn();
    speak("あ", null, { onEnd: first });
    speak("あ", null, { onEnd: second });
    expect(first).toHaveBeenCalledTimes(1);
    expect(cancels).toBe(2);
    expect(second).not.toHaveBeenCalled();
    spoken[0].onend?.(); // sự kiện đến muộn sau cancel
    spoken[0].onerror?.();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    spoken[1].onend?.();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("bấm X rồi Y: X tắt ngay, Y không bị sự kiện của X ghi đè", () => {
    const x = vi.fn();
    const y = vi.fn();
    speak("X", null, { onEnd: x });
    speak("Y", null, { onEnd: y });
    expect(x).toHaveBeenCalledTimes(1);
    expect(y).not.toHaveBeenCalled();
    spoken[0].onerror?.();
    expect(y).not.toHaveBeenCalled();
    spoken[1].onend?.();
    expect(y).toHaveBeenCalledTimes(1);
    expect(x).toHaveBeenCalledTimes(1);
  });

  it("Safari không bắn sự kiện: lượt sau vẫn đóng lượt trước", () => {
    const x = vi.fn();
    speak("X", null, { onEnd: x });
    speak("Y", null);
    expect(x).toHaveBeenCalledTimes(1);
  });

  it("không có speechSynthesis hoặc văn bản rỗng: gọi onEnd ngay", () => {
    const a = vi.fn();
    speak("", null, { onEnd: a });
    expect(a).toHaveBeenCalledTimes(1);
    vi.stubGlobal("window", {});
    const b = vi.fn();
    speak("あ", null, { onEnd: b });
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("speak ném lỗi: onEnd được gọi một lần", () => {
    vi.stubGlobal("window", {
      speechSynthesis: {
        cancel: () => {},
        speak: () => {
          throw new Error("x");
        },
      },
    });
    const onEnd = vi.fn();
    speak("あ", null, { onEnd });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
