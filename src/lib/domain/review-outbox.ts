import type { ReviewPayload } from "./review";

/**
 * Hàng chờ gửi lượt ôn lên `submit_reviews`. Bản sao bền (IndexedDB) nằm sau interface `OutboxStore`
 * để sống sót qua tải lại trang và mất mạng lâu (FR-27); gửi lại cùng `review_id` an toàn nhờ máy chủ idempotent.
 */

/** Kho bền của hàng chờ. Mọi bản ghi gắn userId; `loadForUser` chỉ trả lượt của đúng người đó. */
export interface OutboxStore {
  persist(userId: string, p: ReviewPayload): Promise<void>;
  remove(reviewIds: string[]): Promise<void>;
  loadForUser(userId: string): Promise<ReviewPayload[]>;
}

interface Item {
  userId: string;
  p: ReviewPayload;
  /** Đã ghi vào kho (hoặc ghi lỗi): chỉ gửi sau khi bản bền đã có (FR-27). */
  persisted: Promise<void>;
  /** true khi đã có bản bền trong kho; false nếu chưa ghi xong, ghi lỗi hoặc không có kho. */
  durable: boolean;
}

export interface SubmitResult {
  review_id: string;
  status: string;
}

/** `submit` ném lỗi khi mạng/máy chủ lỗi; `permanent: true` nghĩa là lô bị từ chối vĩnh viễn (không thử lại). */
export class SubmitError extends Error {
  constructor(
    message: string,
    readonly permanent = false,
  ) {
    super(message);
    this.name = "SubmitError";
  }
}

export interface OutboxOptions {
  batchSize?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  now?: () => number;
  /** Hẹn gọi lại `fn` sau `ms` (mặc định setTimeout). */
  schedule?: (fn: () => void, ms: number) => void;
  onChange?: () => void;
  /** Id người dùng của phiên hiện tại (null: chưa đăng nhập). Chỉ lượt của người này được gửi. */
  currentUser?: () => Promise<string | null>;
  warn?: (message: string, detail?: unknown) => void;
  store?: OutboxStore;
}

export class ReviewOutbox {
  private items: Item[] = [];
  private failures = 0;
  private retryAt = 0;
  private inflight: Promise<void> | null = null;
  private readonly store?: OutboxStore;
  private readonly batchSize: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly now: () => number;
  private readonly schedule: (fn: () => void, ms: number) => void;
  private readonly onChange: () => void;
  private readonly currentUser?: () => Promise<string | null>;
  private readonly warn: (message: string, detail?: unknown) => void;

  constructor(
    private readonly submit: (batch: ReviewPayload[]) => Promise<SubmitResult[]>,
    opts: OutboxOptions = {},
  ) {
    this.batchSize = opts.batchSize ?? 20;
    this.baseDelayMs = opts.baseDelayMs ?? 2000;
    this.maxDelayMs = opts.maxDelayMs ?? 30_000;
    this.now = opts.now ?? Date.now;
    this.schedule = opts.schedule ?? ((fn, ms) => void setTimeout(fn, ms));
    this.onChange = opts.onChange ?? (() => {});
    this.currentUser = opts.currentUser;
    this.warn = opts.warn ?? ((m, d) => console.warn(m, d));
    this.store = opts.store;
  }

  get size(): number {
    return this.items.length;
  }

  /** Số lượt chưa có bản bền (ghi IndexedDB lỗi, chưa xong hoặc không dùng được): mất nếu đóng tab. */
  get unpersistedCount(): number {
    return this.items.filter((i) => !i.durable).length;
  }

  /** Đang có lỗi gửi liên tiếp (mất mạng hoặc máy chủ không phản hồi): dùng cho dải báo trạng thái (FR-26). */
  get failing(): boolean {
    return this.failures > 0;
  }

  /**
   * Thêm một lượt, ghi vào kho bền trong nền rồi thử gửi (không chặn; bỏ qua nếu đang chờ backoff).
   * Promise trả về resolve khi bản bền đã ghi xong (không bao giờ reject: lỗi kho chỉ cảnh báo, lượt vẫn ở bộ nhớ).
   */
  enqueue(p: ReviewPayload, userId: string): Promise<void> {
    const store = this.store;
    const item: Item = { userId, p, persisted: Promise.resolve(), durable: false };
    if (store) {
      item.persisted = (async () => store.persist(userId, p))().then(
        () => {
          item.durable = true;
          this.onChange();
        },
        (e) => this.warn("outbox: không ghi được IndexedDB, giữ trong bộ nhớ", e),
      );
    }
    const persisted = item.persisted;
    this.items.push(item);
    this.onChange();
    void this.flush();
    return persisted;
  }

  /** Nạp lượt chưa gửi của `userId` từ kho bền (mở app, có mạng lại) rồi thử gửi. Trùng review_id thì bỏ qua. */
  async hydrate(userId: string, force = false): Promise<void> {
    if (!this.store) return;
    let stored: ReviewPayload[];
    try {
      stored = await this.store.loadForUser(userId);
    } catch (e) {
      this.warn("outbox: không đọc được IndexedDB", e);
      return;
    }
    const have = new Set(this.items.map((i) => i.p.review_id));
    const add: Item[] = stored
      .filter((p) => !have.has(p.review_id))
      .sort((a, b) => a.reviewed_at.localeCompare(b.reviewed_at))
      .map((p) => ({ userId, p, persisted: Promise.resolve(), durable: true }));
    if (add.length > 0) {
      this.items = [...add, ...this.items];
      this.onChange();
    }
    void this.flush(force);
  }

  /** Xóa sạch hàng chờ trong bộ nhớ (đăng xuất). Kho bền do `clearLocalData` xóa; hết phiên đăng nhập vẫn giữ lượt cho lần đăng nhập lại. */
  clear(): void {
    this.items = [];
    this.failures = 0;
    this.retryAt = 0;
    this.onChange();
  }

  /** Gửi lần lượt từng lô cho tới khi hết hoặc gặp lỗi. `force` bỏ qua thời gian chờ backoff. */
  flush(force = false): Promise<void> {
    if (this.inflight) return this.inflight;
    if (this.items.length === 0) return Promise.resolve();
    if (!force && this.now() < this.retryAt) return Promise.resolve();
    const run = this.run().finally(() => {
      this.inflight = null;
    });
    this.inflight = run;
    return run;
  }

  private fail(): void {
    this.failures++;
    const delay = Math.min(this.maxDelayMs, this.baseDelayMs * 2 ** (this.failures - 1));
    this.retryAt = this.now() + delay;
    this.schedule(() => void this.flush(), delay);
    this.onChange();
  }

  private async run(): Promise<void> {
    if (this.currentUser) {
      const uid = await this.currentUser();
      const foreign = this.items.filter((i) => i.userId !== uid);
      if (foreign.length > 0) {
        // Lượt của người dùng khác (hoặc chưa đăng nhập) không bao giờ được gửi; bản bền của họ giữ nguyên.
        this.warn(`submit_reviews: bỏ ${foreign.length} lượt của người dùng khác`);
        this.items = this.items.filter((i) => i.userId === uid);
        this.onChange();
      }
    }
    while (this.items.length > 0) {
      const batchItems = this.items.slice(0, this.batchSize);
      const batch = batchItems.map((i) => i.p);
      await Promise.all(batchItems.map((i) => i.persisted));
      let results: SubmitResult[];
      try {
        results = await this.submit(batch);
      } catch (e) {
        if (e instanceof SubmitError && e.permanent) {
          this.warn("submit_reviews: lô bị từ chối, bỏ", e.message);
          this.drop(batch.map((b) => b.review_id));
          continue;
        }
        this.fail();
        return;
      }
      const hadFailures = this.failures > 0;
      this.failures = 0;
      this.retryAt = 0;
      if (hadFailures) this.onChange();
      const done: string[] = [];
      for (const r of results) {
        if (r.status === "rejected") this.warn("submit_reviews: lượt bị từ chối", r.review_id);
        if (r.status === "accepted" || r.status === "duplicate" || r.status === "rejected") done.push(r.review_id);
      }
      // Lượt không có trong kết quả (máy chủ bỏ sót) giữ lại; không có tiến triển thì dừng, tránh vòng lặp vô hạn.
      const before = this.items.length;
      this.drop(done);
      if (this.items.length === before) {
        this.fail();
        return;
      }
    }
  }

  private drop(ids: string[]): void {
    const set = new Set(ids);
    this.items = this.items.filter((i) => !set.has(i.p.review_id));
    this.onChange();
    const store = this.store;
    if (store && ids.length > 0) {
      void (async () => store.remove(ids))().catch((e) => this.warn("outbox: không xóa được khỏi IndexedDB", e));
    }
  }
}
