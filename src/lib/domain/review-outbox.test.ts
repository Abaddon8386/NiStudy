import { describe, expect, it, vi } from "vitest";
import type { ReviewPayload } from "./review";
import { ReviewOutbox, SubmitError, type OutboxStore, type SubmitResult } from "./review-outbox";

const U = "u1";
const mk = (n: number) => ({ review_id: `r${n}` }) as unknown as ReviewPayload;
const ok = (batch: ReviewPayload[]): SubmitResult[] =>
  batch.map((b) => ({ review_id: b.review_id, status: "accepted" }));

function setup(submit: (b: ReviewPayload[]) => Promise<SubmitResult[]>) {
  let t = 0;
  const timers: { fn: () => void; ms: number }[] = [];
  const warn = vi.fn();
  const outbox = new ReviewOutbox(submit, {
    now: () => t,
    schedule: (fn, ms) => timers.push({ fn, ms }),
    warn,
  });
  return { outbox, timers, warn, advance: (ms: number) => (t += ms) };
}

describe("ReviewOutbox", () => {
  it("gửi lô tối đa 20 lượt và bỏ khỏi hàng chờ khi accepted/duplicate", async () => {
    const batches: number[] = [];
    const { outbox } = setup(async (b) => {
      batches.push(b.length);
      return b.map((x, i) => ({ review_id: x.review_id, status: i % 2 ? "duplicate" : "accepted" }));
    });
    // enqueue tự gửi; lượt thêm khi đang gửi được vòng lặp lấy tiếp theo từng lô.
    for (let i = 0; i < 45; i++) outbox.enqueue(mk(i), U);
    await vi.waitFor(() => expect(outbox.size).toBe(0));
    expect(Math.max(...batches)).toBeLessThanOrEqual(20);
    expect(batches.reduce((a, b) => a + b, 0)).toBe(45);
  });

  it("rejected: cảnh báo và bỏ; thiếu trong kết quả: giữ lại", async () => {
    const { outbox, warn } = setup(async (b) =>
      b.filter((x) => x.review_id === "r1").map((x) => ({ review_id: x.review_id, status: "rejected" })),
    );
    outbox.enqueue(mk(1), U);
    outbox.enqueue(mk(2), U);
    await outbox.flush();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(outbox.size).toBe(1); // r2 bị bỏ sót nên còn
  });

  it("lỗi mạng: giữ lượt, backoff gấp đôi có trần, thành công thì đặt lại", async () => {
    let fail = true;
    const submit = vi.fn(async (b: ReviewPayload[]) => {
      if (fail) throw new Error("network");
      return ok(b);
    });
    const { outbox, timers, advance } = setup(submit);
    outbox.enqueue(mk(1), U);
    await outbox.flush(true);
    expect(outbox.size).toBe(1);
    expect(timers.at(-1)?.ms).toBe(2000);

    // Trong thời gian chờ, flush thường không gọi mạng.
    const calls = submit.mock.calls.length;
    await outbox.flush();
    expect(submit.mock.calls.length).toBe(calls);

    advance(2000);
    await outbox.flush();
    expect(timers.at(-1)?.ms).toBe(4000);
    for (let i = 0; i < 6; i++) {
      advance(60_000);
      await outbox.flush();
    }
    expect(timers.at(-1)?.ms).toBe(30_000);

    fail = false;
    advance(60_000);
    await outbox.flush();
    expect(outbox.size).toBe(0);
    fail = true;
    outbox.enqueue(mk(2), U);
    await outbox.flush(true);
    expect(timers.at(-1)?.ms).toBe(2000);
  });

  it("lỗi vĩnh viễn (SubmitError permanent): bỏ lô, không thử lại", async () => {
    const { outbox, warn, timers } = setup(async () => {
      throw new SubmitError("bad", true);
    });
    outbox.enqueue(mk(1), U);
    await outbox.flush(true);
    expect(outbox.size).toBe(0);
    expect(warn).toHaveBeenCalled();
    expect(timers).toHaveLength(0);
  });

  it("không gửi chồng: flush đồng thời chỉ chạy một lần", async () => {
    let inFlight = 0;
    let max = 0;
    const { outbox } = setup(async (b) => {
      inFlight++;
      max = Math.max(max, inFlight);
      await Promise.resolve();
      inFlight--;
      return ok(b);
    });
    outbox.enqueue(mk(1), U);
    await Promise.all([outbox.flush(), outbox.flush(true)]);
    expect(max).toBe(1);
  });

  it("không gửi lượt của người dùng khác; clear làm rỗng", async () => {
    const sent: string[] = [];
    const warn = vi.fn();
    const outbox = new ReviewOutbox(
      async (b) => {
        sent.push(...b.map((x) => x.review_id));
        return ok(b);
      },
      { warn, currentUser: async () => "u2", schedule: () => {} },
    );
    outbox.enqueue(mk(1), "u1");
    outbox.enqueue(mk(2), "u2");
    await vi.waitFor(() => expect(outbox.size).toBe(0));
    expect(sent).toEqual(["r2"]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("1 lượt"));

    const held = new ReviewOutbox(
      async () => {
        throw new Error("x");
      },
      { schedule: () => {} },
    );
    held.enqueue(mk(3), "u1");
    await held.flush(true);
    expect(held.size).toBe(1);
    held.clear();
    expect(held.size).toBe(0);
  });
});

/** Kho bền giả trong bộ nhớ: ghi lại thứ tự thao tác để kiểm "ghi trước khi gửi". */
function fakeStore() {
  const rows = new Map<string, { userId: string; p: ReviewPayload }>();
  const log: string[] = [];
  const store: OutboxStore = {
    async persist(userId, p) {
      await Promise.resolve();
      log.push(`persist:${p.review_id}`);
      rows.set(p.review_id, { userId, p });
    },
    async remove(ids) {
      for (const id of ids) {
        log.push(`remove:${id}`);
        rows.delete(id);
      }
    },
    async loadForUser(userId) {
      return [...rows.values()].filter((r) => r.userId === userId).map((r) => r.p);
    },
  };
  return { store, rows, log };
}

const mkAt = (n: number, at: string) => ({ review_id: `r${n}`, reviewed_at: at }) as unknown as ReviewPayload;

describe("ReviewOutbox với kho bền", () => {
  it("ghi kho trước khi gửi; accepted/duplicate/rejected thì xóa khỏi kho", async () => {
    const { store, rows, log } = fakeStore();
    const warn = vi.fn();
    const outbox = new ReviewOutbox(
      async (b) =>
        b.map((x) => ({
          review_id: x.review_id,
          status: { r1: "accepted", r2: "duplicate", r3: "rejected" }[x.review_id] ?? "accepted",
        })),
      { store, warn, schedule: () => {} },
    );
    outbox.enqueue(mk(1), U);
    outbox.enqueue(mk(2), U);
    outbox.enqueue(mk(3), U);
    await vi.waitFor(() => expect(outbox.size).toBe(0));
    await vi.waitFor(() => expect(rows.size).toBe(0));
    expect(log.indexOf("persist:r1")).toBeLessThan(log.indexOf("remove:r1"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("bị từ chối"), "r3");
  });

  it("persist xong rồi mới gọi submit", async () => {
    const { store, rows } = fakeStore();
    let storedAtSubmit = -1;
    const outbox = new ReviewOutbox(
      async (b) => {
        storedAtSubmit = rows.size;
        return ok(b);
      },
      { store, schedule: () => {} },
    );
    await outbox.enqueue(mk(1), U);
    await vi.waitFor(() => expect(outbox.size).toBe(0));
    expect(storedAtSubmit).toBe(1);
  });

  it("lỗi mạng giữ nguyên trong kho; lỗi kho chỉ cảnh báo, lượt vẫn được gửi", async () => {
    const { store, rows } = fakeStore();
    const outbox = new ReviewOutbox(
      async () => {
        throw new Error("network");
      },
      { store, schedule: () => {} },
    );
    await outbox.enqueue(mk(1), U);
    await outbox.flush(true);
    expect(outbox.size).toBe(1);
    expect(outbox.failing).toBe(true);
    expect(rows.has("r1")).toBe(true);

    const warn = vi.fn();
    const broken: OutboxStore = {
      persist: async () => {
        throw new Error("quota");
      },
      remove: async () => {},
      loadForUser: async () => [],
    };
    const sent: string[] = [];
    const o2 = new ReviewOutbox(
      async (b) => {
        sent.push(...b.map((x) => x.review_id));
        return ok(b);
      },
      { store: broken, warn, schedule: () => {} },
    );
    await o2.enqueue(mk(9), U);
    await vi.waitFor(() => expect(o2.size).toBe(0));
    expect(sent).toEqual(["r9"]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("IndexedDB"), expect.any(Error));
  });

  it("hydrate chỉ nạp đúng người dùng, không nạp trùng, gửi theo thứ tự reviewed_at", async () => {
    const { store, rows } = fakeStore();
    rows.set("r2", { userId: "u1", p: mkAt(2, "2026-11-20T10:00:02Z") });
    rows.set("r1", { userId: "u1", p: mkAt(1, "2026-11-20T10:00:01Z") });
    rows.set("r3", { userId: "u2", p: mkAt(3, "2026-11-20T10:00:00Z") });
    const sent: string[] = [];
    const outbox = new ReviewOutbox(
      async (b) => {
        sent.push(...b.map((x) => x.review_id));
        return ok(b);
      },
      { store, schedule: () => {}, currentUser: async () => "u1" },
    );
    await outbox.hydrate("u1");
    await outbox.hydrate("u1"); // lần hai không nạp trùng
    await vi.waitFor(() => expect(outbox.size).toBe(0));
    expect(sent).toEqual(["r1", "r2"]);
    await vi.waitFor(() => expect([...rows.keys()]).toEqual(["r3"])); // lượt của u2 còn nguyên
  });

  it("lượt người dùng khác trong bộ nhớ bị bỏ nhưng bản bền của họ giữ nguyên", async () => {
    const { store, rows } = fakeStore();
    const outbox = new ReviewOutbox(async (b) => ok(b), {
      store,
      schedule: () => {},
      warn: () => {},
      currentUser: async () => "u2",
    });
    await outbox.enqueue(mk(1), "u1");
    await vi.waitFor(() => expect(outbox.size).toBe(0));
    expect(rows.has("r1")).toBe(true);
  });

  it("clear làm rỗng bộ nhớ", async () => {
    const { store } = fakeStore();
    const outbox = new ReviewOutbox(
      async () => {
        throw new Error("x");
      },
      { store, schedule: () => {} },
    );
    await outbox.enqueue(mk(1), U);
    await outbox.flush(true);
    outbox.clear();
    expect(outbox.size).toBe(0);
    expect(outbox.failing).toBe(false);
  });

  it("unpersistedCount: ghi kho lỗi đếm 1, ghi được thì 0", async () => {
    const hold = () =>
      new ReviewOutbox(
        async () => {
          throw new Error("offline");
        },
        { schedule: () => {}, warn: () => {}, store: undefined },
      );
    const { store } = fakeStore();
    const good = new ReviewOutbox(async () => { throw new Error("x"); }, { store, schedule: () => {} });
    await good.enqueue(mk(1), U);
    expect(good.size).toBe(1);
    expect(good.unpersistedCount).toBe(0);

    const broken: OutboxStore = {
      persist: async () => { throw new Error("quota"); },
      remove: async () => {},
      loadForUser: async () => [],
    };
    const bad = new ReviewOutbox(async () => { throw new Error("x"); }, { store: broken, schedule: () => {}, warn: () => {} });
    await bad.enqueue(mk(2), U);
    expect(bad.size).toBe(1);
    expect(bad.unpersistedCount).toBe(1);
    expect(hold().unpersistedCount).toBe(0);
  });
});
