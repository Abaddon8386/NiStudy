"use client";

import { useSyncExternalStore } from "react";
import { ReviewOutbox } from "@/lib/domain/review-outbox";
import { createClient } from "@/lib/supabase/client";
import { submitReviews } from "./api";

/**
 * Hàng chờ dùng chung cả ứng dụng (singleton) để việc gửi tiếp tục khi người dùng rời màn phiên ôn.
 * Mỗi lượt gắn userId; chỉ lượt của người dùng đang đăng nhập được gửi. Xóa khi đăng xuất (`clearOutbox`).
 * TODO FR-27 (sprint 3): lưu IndexedDB.
 */
const listeners = new Set<() => void>();
let outbox: ReviewOutbox | undefined;

export function getOutbox(): ReviewOutbox {
  if (!outbox) {
    outbox = new ReviewOutbox(submitReviews, {
      onChange: () => listeners.forEach((l) => l()),
      currentUser: async () => (await createClient().auth.getSession()).data.session?.user.id ?? null,
    });
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => void outbox?.flush(true));
    }
  }
  return outbox;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** Số lượt chưa gửi, cập nhật khi hàng chờ đổi. */
export function usePendingCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => getOutbox().size,
    () => 0,
  );
}

/** Xóa hàng chờ trong bộ nhớ (đăng xuất, xóa dữ liệu cục bộ). Không tạo hàng chờ mới nếu chưa có. */
export function clearOutbox(): void {
  outbox?.clear();
}

/** Số lượt chưa gửi hiện tại (đọc tức thời, dùng trong sự kiện). */
export function pendingNow(): number {
  return outbox?.size ?? 0;
}

/** Thử gửi một lần ngay (bỏ qua backoff). */
export async function flushOutbox(): Promise<void> {
  if (outbox) await outbox.flush(true);
}
