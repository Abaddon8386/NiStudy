"use client";

import { useCallback, useSyncExternalStore } from "react";
import { AUTO_SPEAK_KEY, readAutoSpeak, writeAutoSpeak } from "./preference";
import { voiceStore, type VoiceState } from "./voice-store";

/** Trạng thái giọng tiếng Nhật của thiết bị; dùng chung một lần dò cho mọi thành phần. */
export function useJapaneseVoice(): VoiceState {
  return useSyncExternalStore(voiceStore.subscribe, voiceStore.getSnapshot, voiceStore.getServerSnapshot);
}

const AUTO_EVENT = "nihongo:auto-speak-change";

function subscribeAuto(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === AUTO_SPEAK_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTO_EVENT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTO_EVENT, cb);
  };
}

// Giá trị lưu trong bộ nhớ khi localStorage không ghi được, để công tắc vẫn đổi trong phiên.
let memoryValue: boolean | null = null;

/** Tùy chọn "Tự phát âm khi lật thẻ" (localStorage, mặc định tắt) và hàm đổi. */
export function useAutoSpeak(): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    subscribeAuto,
    () => memoryValue ?? readAutoSpeak(),
    () => false,
  );
  const set = useCallback((v: boolean) => {
    memoryValue = writeAutoSpeak(v) ? null : v;
    window.dispatchEvent(new Event(AUTO_EVENT));
  }, []);
  return [value, set];
}
