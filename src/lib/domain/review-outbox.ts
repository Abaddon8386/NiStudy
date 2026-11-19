import type { ReviewPayload } from "./review";

/**
 * Hàng chờ gửi lượt ôn lên `submit_reviews`, nằm trong bộ nhớ.
 * TODO FR-27 (sprint 3): lưu hàng chờ vào IndexedDB để sống sót qua tải lại trang và mất mạng lâu.
 */

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
}

export class ReviewOutbox {
  private items: { userId: string; p: ReviewPayload }[] = [];
  private failures = 0;
  private retryAt = 0;
  private running = false;
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
  }

  get size(): number {
    return this.items.length;
  }

  /** Thêm một lượt và thử gửi (không chặn; bỏ qua nếu đang chờ backoff). */
  enqueue(p: ReviewPayload, userId: string): void {
    this.items.push({ userId, p });
    this.onChange();
    void this.flush();
  }

  /** Xóa sạch hàng chờ (đăng xuất, xóa dữ liệu cục bộ). */
  clear(): void {
    this.items = [];
    this.failures = 0;
    this.retryAt = 0;
    this.onChange();
  }

  /** Gửi lần lượt từng lô cho tới khi hết hoặc gặp lỗi. `force` bỏ qua thời gian chờ backoff. */
  async flush(force = false): Promise<void> {
    if (this.running || this.items.length === 0) return;
    if (!force && this.now() < this.retryAt) return;
    this.running = true;
    try {
      if (this.currentUser) {
        const uid = await this.currentUser();
        const foreign = this.items.filter((i) => i.userId !== uid);
        if (foreign.length > 0) {
          // Lượt của người dùng khác (hoặc chưa đăng nhập) không bao giờ được gửi.
          this.warn(`submit_reviews: bỏ ${foreign.length} lượt của người dùng khác`);
          this.items = this.items.filter((i) => i.userId === uid);
          this.onChange();
        }
      }
      while (this.items.length > 0) {
        const batch = this.items.slice(0, this.batchSize).map((i) => i.p);
        let results: SubmitResult[];
        try {
          results = await this.submit(batch);
        } catch (e) {
          if (e instanceof SubmitError && e.permanent) {
            this.warn("submit_reviews: lô bị từ chối, bỏ", e.message);
            this.drop(batch.map((b) => b.review_id));
            continue;
          }
          this.failures++;
          const delay = Math.min(this.maxDelayMs, this.baseDelayMs * 2 ** (this.failures - 1));
          this.retryAt = this.now() + delay;
          this.schedule(() => void this.flush(), delay);
          return;
        }
        this.failures = 0;
        this.retryAt = 0;
        const done: string[] = [];
        for (const r of results) {
          if (r.status === "rejected") this.warn("submit_reviews: lượt bị từ chối", r.review_id);
          if (r.status === "accepted" || r.status === "duplicate" || r.status === "rejected") done.push(r.review_id);
        }
        // Lượt không có trong kết quả (máy chủ bỏ sót) giữ lại; không có tiến triển thì dừng, tránh vòng lặp vô hạn.
        const before = this.items.length;
        this.drop(done);
        if (this.items.length === before) {
          this.failures++;
          const delay = Math.min(this.maxDelayMs, this.baseDelayMs * 2 ** (this.failures - 1));
          this.retryAt = this.now() + delay;
          this.schedule(() => void this.flush(), delay);
          return;
        }
      }
    } finally {
      this.running = false;
    }
  }

  private drop(ids: string[]): void {
    const set = new Set(ids);
    this.items = this.items.filter((i) => !set.has(i.p.review_id));
    this.onChange();
  }
}
