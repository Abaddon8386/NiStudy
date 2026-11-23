/** Tùy chọn thiết bị "Tự phát âm khi lật thẻ" (FR-C2): chỉ lưu trong localStorage, không lên máy chủ. */
export const AUTO_SPEAK_KEY = "nihongo:auto-speak";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Mặc định tắt; mọi lỗi đọc (chế độ riêng tư, bị chặn) coi như tắt. */
export function readAutoSpeak(storage: StorageLike | null = defaultStorage()): boolean {
  try {
    return storage?.getItem(AUTO_SPEAK_KEY) === "1";
  } catch {
    return false;
  }
}

/** Trả true nếu ghi được. */
export function writeAutoSpeak(value: boolean, storage: StorageLike | null = defaultStorage()): boolean {
  try {
    if (!storage) return false;
    storage.setItem(AUTO_SPEAK_KEY, value ? "1" : "0");
    return true;
  } catch {
    return false;
  }
}
