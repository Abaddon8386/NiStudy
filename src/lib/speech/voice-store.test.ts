import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetVoiceStoreForTest, voiceStore, VOICE_WAIT_MS } from "./voice-store";

type V = { name: string; lang: string };
const JA: V = { name: "Kyoko", lang: "ja-JP" };

let voices: V[];
let listeners: Map<string, Set<() => void>>;

function installSynth() {
  listeners = new Map();
  vi.stubGlobal("SpeechSynthesisUtterance", class {});
  vi.stubGlobal("window", {
    speechSynthesis: {
      getVoices: () => voices,
      addEventListener: (type: string, cb: () => void) => {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(cb);
      },
      removeEventListener: (type: string, cb: () => void) => listeners.get(type)?.delete(cb),
    },
  });
}
const fire = () => listeners.get("voiceschanged")?.forEach((cb) => cb());

beforeEach(() => {
  vi.useFakeTimers();
  voices = [];
  resetVoiceStoreForTest();
});
afterEach(() => {
  resetVoiceStoreForTest();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("voiceStore", () => {
  it("giọng có ngay: ready", () => {
    voices = [JA];
    installSynth();
    voiceStore.subscribe(() => {});
    expect(voiceStore.getSnapshot().status).toBe("ready");
    expect(voiceStore.getSnapshot().voice).toBe(JA);
  });

  it("giọng đến qua voiceschanged trước 1,5s: ready, báo người đăng ký", () => {
    installSynth();
    const cb = vi.fn();
    voiceStore.subscribe(cb);
    expect(voiceStore.getSnapshot().status).toBe("checking");
    vi.advanceTimersByTime(VOICE_WAIT_MS - 100);
    voices = [JA];
    fire();
    expect(voiceStore.getSnapshot().status).toBe("ready");
    expect(cb).toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(voiceStore.getSnapshot().status).toBe("ready");
  });

  it("hết 1,5s thành no-voice, voiceschanged sau đó nâng lên ready", () => {
    voices = [{ name: "English", lang: "en-US" }];
    installSynth();
    voiceStore.subscribe(() => {});
    vi.advanceTimersByTime(VOICE_WAIT_MS - 1);
    expect(voiceStore.getSnapshot().status).toBe("checking");
    vi.advanceTimersByTime(1);
    expect(voiceStore.getSnapshot().status).toBe("no-voice");
    voices = [JA];
    fire();
    expect(voiceStore.getSnapshot()).toEqual({ status: "ready", voice: JA });
  });

  it("không có speechSynthesis: unsupported", () => {
    vi.stubGlobal("window", {});
    voiceStore.subscribe(() => {});
    expect(voiceStore.getSnapshot().status).toBe("unsupported");
  });
});
