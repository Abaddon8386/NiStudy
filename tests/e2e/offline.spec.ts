import AxeBuilder from "@axe-core/playwright";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

/**
 * Lưu bền lượt ôn và phiên ôn khi mất mạng (FR-27, FR-28, FR-30, NFR-19).
 * Chặn RPC bằng page.route; IndexedDB thật của trình duyệt.
 */

interface Item {
  card: { id: string; kind: string; level?: string | null };
  [k: string]: unknown;
}
interface Queue {
  due: Item[];
  new_done_today: number;
  new_candidates: Item[];
}
interface Submitted {
  review_id: string;
  card_id: string;
  rating: number;
}

const sample = JSON.parse(readFileSync("tests/fixtures/queue-sample.json", "utf8")) as Queue;

/** n thẻ từ vựng đến hạn, id khác nhau. */
function dueQueue(n: number): Queue {
  return {
    due: Array.from({ length: n }, (_, i) => ({
      ...structuredClone(sample.due[0]),
      card: { ...sample.due[0].card, id: `vocab:${i + 1}` },
    })),
    new_done_today: 0,
    new_candidates: [],
  };
}

const USER_A = "00000000-0000-4000-8000-000000000001";
const USER_B = "00000000-0000-4000-8000-0000000000b2";

async function mockLearning(page: Page, queue: Queue) {
  const submitted: Submitted[] = [];
  const ctl = { offline: false, failSubmit: false, status: "accepted", queueCalls: 0, submitCalls: 0 };
  await page.route("**/rest/v1/rpc/get_today_queue", (route) => {
    ctl.queueCalls++;
    if (ctl.offline) return route.abort("internetdisconnected");
    return route.fulfill({ json: queue });
  });
  await page.route("**/rest/v1/rpc/submit_reviews", (route) => {
    ctl.submitCalls++;
    if (ctl.offline) return route.abort("internetdisconnected");
    if (ctl.failSubmit) return route.abort("failed");
    const body = JSON.parse(route.request().postData() ?? "{}") as { p_reviews: Submitted[] };
    submitted.push(...body.p_reviews);
    return route.fulfill({ json: body.p_reviews.map((r) => ({ review_id: r.review_id, status: ctl.status })) });
  });
  return { submitted, ctl };
}

async function goOffline(context: BrowserContext, ctl: { offline: boolean }, offline: boolean) {
  ctl.offline = offline;
  await context.setOffline(offline);
}

/** Đọc thẳng IndexedDB `nihongo` (không tạo DB nếu chưa có). null: chưa có DB. */
async function idbDump(page: Page) {
  return page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    if (!dbs.some((d) => d.name === "nihongo")) return null;
    return new Promise<{ outbox: { review_id: string; userId: string }[]; session: { userId: string; state: { index: number } }[] }>(
      (resolve, reject) => {
        const req = indexedDB.open("nihongo");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(["outbox", "session"]);
          const o = tx.objectStore("outbox").getAll();
          const s = tx.objectStore("session").getAll();
          tx.oncomplete = () => {
            db.close();
            resolve({ outbox: o.result, session: s.result });
          };
          tx.onerror = () => reject(tx.error);
        };
      },
    );
  });
}

const outboxIds = async (page: Page) => (await idbDump(page))?.outbox.map((r) => r.review_id) ?? [];

async function waitShell(page: Page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(async () => {
    const name = (await caches.keys()).find((k) => k.startsWith("serwist-precache"));
    if (!name) return false;
    const urls = (await (await caches.open(name)).keys()).map((r) => new URL(r.url).pathname);
    return ["/", "/on-tap"].every((u) => urls.includes(u));
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
}

const progress = (page: Page, text: string) => expect(page.locator("header p[aria-live]")).toContainText(text);
const gradeGood = async (page: Page) => {
  await expect(page.getByRole("button", { name: /Lật thẻ/ })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: /^Được/ })).toBeVisible();
  await page.keyboard.press("3");
};
const axe = async (page: Page) => {
  await page.waitForTimeout(700);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
};

const OFFLINE_MESSAGE = "Không có mạng. Không tải được thẻ mới; các lượt đã chấm sẽ được gửi khi có mạng.";

async function startReview(page: Page, queue: Queue) {
  await mockLoggedInBackend(page);
  const m = await mockLearning(page, queue);
  await loginViaForm(page);
  await expect(page.getByRole("link", { name: "Bắt đầu ôn" })).toBeVisible();
  return m;
}

test.describe("ôn tập khi mất mạng (FR-27, FR-28)", () => {
  test("mất mạng giữa phiên: lưu lượt và phiên, tải lại vẫn offline thì tiếp tục, có mạng thì gửi đủ", async ({
    page,
    context,
  }) => {
    const { submitted, ctl } = await startReview(page, dueQueue(4));
    await waitShell(page);
    await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
    await expect(page).toHaveURL(/\/on-tap$/);
    await progress(page, "1 / 4");
    await expect(page.getByTestId("network-banner")).toHaveText("");
    // Tải lại khi còn mạng để chunk của trang được service worker cache; phiên đã lưu được tiếp tục.
    await page.reload();
    await progress(page, "1 / 4");

    await goOffline(context, ctl, true);
    await expect(page.getByTestId("network-banner")).toContainText("Mất kết nối mạng");
    await axe(page);

    await gradeGood(page);
    await progress(page, "2 / 4");
    await gradeGood(page);
    await progress(page, "3 / 4");
    // Bản bền: 2 lượt chưa gửi, snapshot ở vị trí thứ 3.
    await expect.poll(async () => (await outboxIds(page)).length).toBe(2);
    await expect.poll(async () => (await idbDump(page))?.session[0]?.state.index).toBe(2);
    expect((await idbDump(page))?.outbox.every((r) => r.userId === USER_A)).toBe(true);
    expect(submitted).toHaveLength(0);

    // Tải lại khi vẫn offline: tiếp tục đúng vị trí, không gọi RPC tải thẻ.
    const queueCalls = ctl.queueCalls;
    await page.reload();
    await progress(page, "3 / 4");
    await expect(page.getByTestId("network-banner")).toContainText("Mất kết nối mạng");
    expect(ctl.queueCalls).toBe(queueCalls);
    expect(await outboxIds(page)).toHaveLength(2);

    // Có mạng lại: gửi đủ, không trùng, kho rỗng, dải báo tự ẩn.
    await goOffline(context, ctl, false);
    await expect.poll(() => submitted.length, { timeout: 15_000 }).toBe(2);
    expect(new Set(submitted.map((r) => r.review_id)).size).toBe(2);
    expect(submitted.map((r) => r.card_id)).toEqual(["vocab:1", "vocab:2"]);
    await expect.poll(async () => (await outboxIds(page)).length).toBe(0);
    await expect(page.getByTestId("network-banner")).toHaveText("");

    // Phiên vẫn tiếp tục sau khi có mạng.
    await gradeGood(page);
    await progress(page, "4 / 4");
  });

  test("máy chủ trả duplicate khi gửi lại: kho rỗng", async ({ page }) => {
    const { ctl, submitted } = await startReview(page, dueQueue(1));
    ctl.failSubmit = true;
    await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
    await gradeGood(page);
    await expect(page.getByTestId("send-status")).toHaveText("Còn 1 lượt chưa gửi, sẽ thử lại.");
    await expect.poll(async () => (await outboxIds(page)).length).toBe(1);

    ctl.failSubmit = false;
    ctl.status = "duplicate";
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect.poll(async () => (await outboxIds(page)).length).toBe(0);
    await expect(page.getByTestId("send-status")).toHaveText("Đã lưu hết.");
    expect(submitted).toHaveLength(1);
  });

  test("đăng xuất khi còn lượt trong IndexedDB: cảnh báo đúng số, Vẫn đăng xuất thì xóa DB", async ({ page }) => {
    const { ctl } = await startReview(page, dueQueue(2));
    ctl.failSubmit = true;
    await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
    await gradeGood(page);
    await gradeGood(page);
    await expect(page.getByTestId("send-status")).toHaveText("Còn 2 lượt chưa gửi, sẽ thử lại.");
    await expect.poll(async () => (await outboxIds(page)).length).toBe(2);

    await page.getByRole("link", { name: "Về trang chính" }).click();
    await page.getByRole("link", { name: "Cài đặt" }).click();
    await expect(page).toHaveURL(/\/cai-dat$/);
    // Tải lại: bộ nhớ trống, lượt chỉ còn trong IndexedDB; cảnh báo vẫn đếm đúng.
    await page.reload();
    await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page.getByRole("alertdialog")).toContainText("Còn 2 lượt ôn chưa gửi.");
    await page.getByRole("button", { name: "Vẫn đăng xuất" }).click();
    await expect(page).toHaveURL(/\/dang-nhap$/);
    await expect
      .poll(() => page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name)))
      .not.toContain("nihongo");
  });

  test("người dùng khác đăng nhập trên cùng trình duyệt không gửi lượt của người trước", async ({ page, context }) => {
    const { ctl, submitted } = await startReview(page, dueQueue(1));
    ctl.failSubmit = true;
    await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
    await gradeGood(page);
    await expect.poll(async () => (await outboxIds(page)).length).toBe(1);

    // Người dùng B đăng nhập (phiên A hết hạn, không đăng xuất): bản ghi của A còn trong DB.
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const user = { id: USER_B, aud: "authenticated", role: "authenticated", email: "khac@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-11-18T00:00:00Z" };
    const token = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: USER_B, role: "authenticated", exp })}.sig`;
    await page.route("**/auth/v1/**", (route) => {
      if (route.request().url().includes("/token")) {
        return route.fulfill({ json: { access_token: token, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "fake-b", user } });
      }
      return route.fulfill({ status: 204, body: "" });
    });
    await context.clearCookies();
    ctl.failSubmit = false;
    const callsBefore = ctl.submitCalls;
    await page.goto("/dang-nhap");
    await loginViaForm(page);
    await expect(page.getByRole("link", { name: "Bắt đầu ôn" })).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await page.waitForTimeout(1500);

    expect(submitted).toHaveLength(0);
    expect(ctl.submitCalls).toBe(callsBefore);
    const dump = await idbDump(page);
    expect(dump?.outbox.map((r) => r.userId)).toEqual([USER_A]);
  });

  test("offline và chưa có phiên đã lưu: báo không tải được thẻ mới, không gọi RPC", async ({ page, context }) => {
    const { ctl } = await startReview(page, dueQueue(2));
    await waitShell(page);
    await goOffline(context, ctl, true);
    await page.goto("/on-tap");
    await expect(page.getByText(OFFLINE_MESSAGE)).toBeVisible();
    expect(ctl.queueCalls).toBe(0);
    await axe(page);

    // Có mạng lại: tự tải thẻ.
    await goOffline(context, ctl, false);
    await progress(page, "1 / 2");
  });
});
