"use client";

export type SaveState = "idle" | "saving" | "saved" | "failed";

/** Vùng thông báo lưu: luôn có trong DOM để trình đọc màn hình đọc khi nội dung đổi. */
export function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  return (
    <span aria-live="polite" className="inline-flex min-h-6 items-center text-sm text-ink-2">
      {state === "saving" && "Đang lưu…"}
      {state === "saved" && "Đã lưu"}
      {state === "failed" && (
        <>
          <span className="font-medium text-bad">Chưa lưu được.</span>
          <button
            type="button"
            onClick={onRetry}
            className="ml-1 inline-flex min-h-11 items-center px-2 font-bold text-ink underline underline-offset-4"
          >
            Thử lại
          </button>
        </>
      )}
    </span>
  );
}
