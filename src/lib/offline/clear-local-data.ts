/**
 * Xóa dữ liệu cục bộ của ứng dụng khi đăng xuất / xóa tài khoản (FR-03, FR-30).
 * TODO (FR-30): khi có outbox lượt ôn, phải cảnh báo/gửi trước khi gọi hàm này; nếu offline mà người dùng
 * vẫn đăng xuất thì mới xóa. Hiện chưa có outbox nên xóa thẳng.
 */
export async function clearLocalData(): Promise<void> {
  try {
    sessionStorage.clear();
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
