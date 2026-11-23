import { pickJapaneseVoice } from "./pick-voice";

export type VoiceStatus = "checking" | "ready" | "unsupported" | "no-voice";
export interface VoiceState {
  status: VoiceStatus;
  voice: SpeechSynthesisVoice | null;
}

/** Chờ tối đa bấy lâu cho danh sách giọng nạp chậm (Chrome, Safari) rồi mới kết luận không có giọng. */
export const VOICE_WAIT_MS = 1500;

const CHECKING: VoiceState = { status: "checking", voice: null };
const SERVER: VoiceState = CHECKING;
let state: VoiceState = CHECKING;
let started = false;
let timedOut = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function set(next: VoiceState) {
  if (next.status === state.status && next.voice === state.voice) return;
  state = next;
  listeners.forEach((l) => l());
}

function evaluate() {
  const synth = window.speechSynthesis;
  const voice = pickJapaneseVoice(synth.getVoices());
  if (voice) set({ status: "ready", voice });
  else if (timedOut) set({ status: "no-voice", voice: null });
}

function start() {
  if (started) return;
  started = true;
  if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
    set({ status: "unsupported", voice: null });
    return;
  }
  const synth = window.speechSynthesis;
  synth.addEventListener?.("voiceschanged", evaluate);
  timer = setTimeout(() => {
    timedOut = true;
    evaluate();
  }, VOICE_WAIT_MS);
  evaluate();
}

export const voiceStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    start();
    return () => {
      listeners.delete(cb);
    };
  },
  getSnapshot: () => state,
  getServerSnapshot: () => SERVER,
};

/** CHỈ CHO TEST: đưa store về trạng thái ban đầu (hủy hẹn giờ, bỏ listener, quên đã khởi động). */
export function resetVoiceStoreForTest() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (typeof window !== "undefined") window.speechSynthesis?.removeEventListener?.("voiceschanged", evaluate);
  state = CHECKING;
  started = false;
  timedOut = false;
  listeners.clear();
}
