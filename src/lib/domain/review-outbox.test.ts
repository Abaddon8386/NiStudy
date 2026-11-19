import { describe, expect, it, vi } from "vitest";
import type { ReviewPayload } from "./review";
import { ReviewOutbox, SubmitError, type SubmitResult } from "./review-outbox";

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
    const { outbox, warn } = setup(async (b) => [
      { review_id: b[0].review_id, status: "rejected" },
    ]);
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
