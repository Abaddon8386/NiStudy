import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { OutboxStore } from "@/lib/domain/review-outbox";
import type { ReviewPayload } from "@/lib/domain/review";
import type { SessionSnapshot } from "@/lib/domain/session-resume";

/**
 * Kho IndexedDB `nihongo` (ADR-0004, FR-27, FR-28, FR-30). Mọi bản ghi có `userId`; đọc luôn lọc theo
 * người dùng hiện tại. Không lưu dữ liệu nào khác ngoài lượt ôn chưa gửi và snapshot phiên ôn.
 */
export const DB_NAME = "nihongo";
const DB_VERSION = 1;

type OutboxRecord = ReviewPayload & { userId: string };
type SessionRecord = SessionSnapshot & { savedAt: number };

interface NihongoDB extends DBSchema {
  outbox: { key: string; value: OutboxRecord; indexes: { userId: string } };
  session: { key: string; value: SessionRecord };
}

let dbPromise: Promise<IDBPDatabase<NihongoDB>> | null = null;

function getDb(): Promise<IDBPDatabase<NihongoDB>> {
  if (!dbPromise) {
    const p = openDB<NihongoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("outbox", { keyPath: "review_id" }).createIndex("userId", "userId");
        db.createObjectStore("session", { keyPath: "userId" });
      },
      // Tab khác xóa/nâng cấp DB: đóng kết nối để không chặn.
      blocking() {
        void p.then((db) => db.close()).catch(() => {});
        if (dbPromise === p) dbPromise = null;
      },
      terminated() {
        if (dbPromise === p) dbPromise = null;
      },
    });
    p.catch(() => {
      if (dbPromise === p) dbPromise = null;
    });
    dbPromise = p;
  }
  return dbPromise;
}

/** Kho bền cho `ReviewOutbox`. */
export const idbOutboxStore: OutboxStore = {
  async persist(userId, p) {
    const db = await getDb();
    await db.put("outbox", { ...p, userId });
  },
  async remove(reviewIds) {
    if (reviewIds.length === 0) return;
    const db = await getDb();
    const tx = db.transaction("outbox", "readwrite");
    await Promise.all([...reviewIds.map((id) => tx.store.delete(id)), tx.done]);
  },
  async loadForUser(userId) {
    const db = await getDb();
    const rows = await db.getAllFromIndex("outbox", "userId", userId);
    return rows.map((r) => {
      const { userId: _u, ...p } = r;
      void _u;
      return p;
    });
  },
};

export async function saveSnapshot(snap: SessionSnapshot): Promise<void> {
  const db = await getDb();
  await db.put("session", { ...snap, savedAt: Date.now() });
}

/** Snapshot phiên của đúng người dùng này (null nếu không có). */
export async function loadSnapshot(userId: string): Promise<SessionSnapshot | null> {
  const db = await getDb();
  const rec = await db.get("session", userId);
  if (!rec || rec.userId !== userId) return null;
  const { savedAt: _s, ...snap } = rec;
  void _s;
  return snap;
}

export async function deleteSnapshot(userId: string): Promise<void> {
  const db = await getDb();
  await db.delete("session", userId);
}

/** Xóa hẳn DB `nihongo` (đăng xuất, xóa tài khoản). Không treo quá 3 giây nếu tab khác giữ kết nối. */
export async function deleteLocalDb(): Promise<void> {
  const current = dbPromise;
  dbPromise = null;
  try {
    (await current)?.close();
  } catch {
    /* kết nối chưa mở được */
  }
  await Promise.race([deleteDB(DB_NAME), new Promise<void>((r) => setTimeout(r, 3000))]);
}
