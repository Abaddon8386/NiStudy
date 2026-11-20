"use client";

import { useSyncExternalStore } from "react";
import { ReviewOutbox } from "@/lib/domain/review-outbox";
import { idbOutboxStore } from "@/lib/offline/db";
import { createClient } from "@/lib/supabase/client";
import { submitReviews } from "./api";

/**
 * Hàng chờ dùng chung cả ứng dụng (singleton) để việc gửi tiếp tục khi người dùng rời màn phiên ôn.
 * Mỗi lượt gắn userId; chỉ lượt của người dùng đang đăng nhập được gửi. Bản bền nằm trong IndexedDB
 * (FR-27): `hydrateOutbox` nạp lại lượt của người dùng hiện tại khi mở app và khi có mạng lại.
 * Bộ nhớ xóa khi đăng xuất (`clearOutbox`); kho bền do `clearLocalData` xóa.
 */
const listeners = new Set<() => void>();
let outbox: ReviewOutbox | undefined;

async function currentUserId(): Promise<string | null> {
  return (await createClient().auth.getSession()).data.session?.user.id ?? null;
}

export function getOutbox(): ReviewOutbox {
  if (!outbox) {
    outbox = new ReviewOutbox(submitReviews, {
      onChange: () => listeners.forEach((l) => l()),
      currentUser: currentUserId,
      store: idbOutboxStore,
    });
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => void hydrateOutbox(true));
    }
  }
  return outbox;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** Nạp lượt chưa gửi của người dùng hiện tại từ IndexedDB vào hàng chờ và thử gửi (FR-27). */
export async function hydrateOutbox(force = false): Promise<void> {
  try {
    const id = await currentUserId();
    if (id) await getOutbox().hydrate(id, force);
  } catch (e) {
    console.warn("outbox: không nạp lại được", e);
  }
}

/** Đang có lỗi gửi liên tiếp (FR-26). */
export function useOutboxFailing(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getOutbox().failing,
    () => false,
  );
}

/** Số lượt chưa gửi và chưa có bản bền (để cảnh báo khi đóng tab). */
export function useUnpersistedCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => getOutbox().unpersistedCount,
    () => 0,
  );
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
