import { clearOutbox } from "@/lib/learning/outbox";
import { deleteLocalDb } from "./db";

/**
 * Xóa dữ liệu cục bộ của ứng dụng khi đăng xuất / xóa tài khoản (FR-03, FR-30).
 * Nơi gọi phải cảnh báo/gửi hàng chờ lượt ôn trước (xem SignOutButton); hàm này xóa hàng chờ trong bộ nhớ,
 * sessionStorage và xóa hẳn DB IndexedDB `nihongo` (lượt chưa gửi, snapshot phiên ôn).
 */
export async function clearLocalData(): Promise<void> {
  clearOutbox();
  try {
    sessionStorage.clear();
  } catch {
    /* bỏ qua */
  }
  try {
    await deleteLocalDb();
  } catch {
    /* bỏ qua */
  }
  try {
    const dbs = (await indexedDB.databases?.()) ?? [];
    await Promise.all(
      dbs
        .filter((db) => db.name?.startsWith("nihongo"))
        .map(
          (db) =>
            new Promise<void>((resolve) => {
              const req = indexedDB.deleteDatabase(db.name as string);
              req.onsuccess = req.onerror = req.onblocked = () => resolve();
            }),
        ),
    );
  } catch {
    /* bỏ qua */
  }
}
