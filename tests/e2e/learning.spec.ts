import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

interface Item {
  card: { id: string; kind: string; level?: string | null };
  [k: string]: unknown;
}
interface Queue {
  due: Item[];
  new_done_today: number;
  new_candidates: Item[];
}

const sample = JSON.parse(readFileSync("tests/fixtures/queue-sample.json", "utf8")) as Queue;
/**
 * 1 thẻ đến hạn (vocab), 1 kana mới, 1 kanji mới có từ ví dụ. Kana ở nhóm âm đục để hết giai đoạn
 * hiragana cơ bản của FR-13 (nếu không, thẻ mới chỉ có kana).
 */
const queue3: Queue = {
  ...sample,
  new_candidates: sample.new_candidates
    .filter((c) => c.card.kind !== "vocab")
    .map((c) =>
      c.card.kind === "kana" ? { ...c, details: { ...(c.details as object), grp: "dakuten" } } : c,
    ) as Item[],
};
const STATE_KEYS = [
  "difficulty", "due", "elapsed_days", "last_review", "lapses", "learning_steps",
  "reps", "scheduled_days", "stability", "state",
].sort();

interface Submitted {
  review_id: string;
  card_id: string;
  rating: number;
  study_date: string;
  state_before: Record<string, unknown>;
  state_after: Record<string, unknown>;
  [k: string]: unknown;
}

async function mockLearning(page: Page, queue: Queue) {
  const submitted: Submitted[] = [];
  const ctl = { failSubmit: false, submitCalls: 0 };
  await page.route("**/rest/v1/rpc/get_today_queue", (route) => route.fulfill({ json: queue }));
  await page.route("**/rest/v1/rpc/submit_reviews", (route) => {
    ctl.submitCalls++;
    if (ctl.failSubmit) return route.abort("failed");
    const body = JSON.parse(route.request().postData() ?? "{}") as { p_reviews: Submitted[] };
    submitted.push(...body.p_reviews);
    return route.fulfill({
      json: body.p_reviews.map((r) => ({ review_id: r.review_id, status: "accepted" })),
    });
  });
  return { submitted, ctl };
}

async function openReview(page: Page, queue: Queue) {
  await mockLoggedInBackend(page);
  const m = await mockLearning(page, queue);
  await loginViaForm(page);
  await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
  await expect(page).toHaveURL(/\/on-tap$/);
  return m;
}

const progress = (page: Page, text: string) => expect(page.locator("header p[aria-live]")).toContainText(text);
const flip = async (page: Page) => {
  await expect(page.getByRole("button", { name: /Lật thẻ/ })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: /^Được/ })).toBeVisible();
};
const axe = async (page: Page) => {
  await page.waitForTimeout(700); // chờ hiệu ứng lật/hiện nút xong để đo tương phản đúng
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
};

test.describe("phiên ôn (S-07, S-08)", () => {
  test("một lần bấm từ trang chính; Space lật; phím 3 chấm Được; Lại đưa thẻ về cuối; tổng kết", async ({ page }) => {
    const { submitted } = await openReview(page, queue3);

    // Thẻ đầu tiên hiện ngay: từ vựng đến hạn, chỉ có nút Lật thẻ.
    await progress(page, "1 / 3");
    await expect(page.getByText("学生").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Lật thẻ/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Được/ })).toHaveCount(0);
    await axe(page);

    await page.keyboard.press("Space");
    await expect(page.getByText("がくせい")).toBeVisible();
    await expect(page.getByText("sinh viên")).toBeVisible();
    await axe(page);
    await page.keyboard.press("3");
    await progress(page, "2 / 3");

    // Kana mới: chấm Lại.
    await expect(page.getByText("Thẻ mới")).toBeVisible();
    await flip(page);
    await expect(page.getByText("i", { exact: true })).toBeVisible();
    await page.keyboard.press("1");
    await progress(page, "3 / 4"); // thẻ Lại được xếp lại cuối phiên

    // Kanji mới.
    await flip(page);
    await expect(page.getByText("HỌC", { exact: true })).toBeVisible();
    await expect(page.getByText("ガク")).toBeVisible();
    await expect(page.getByText("まな.ぶ")).toBeVisible();
    await expect(page.getByText("がくせい").last()).toBeVisible();
    await page.keyboard.press("4");

    // Kana xuất hiện lại.
    await progress(page, "4 / 4");
    await flip(page);
    await page.keyboard.press("3");

    await expect(page.getByRole("heading", { name: "Xong rồi." })).toBeVisible();
    await expect(page.getByText("4 lượt ôn · 2 thẻ mới")).toBeVisible();
    const counts = page.locator("dl > div");
    await expect(counts.nth(0)).toContainText("Lại1");
    await expect(counts.nth(1)).toContainText("Khó0");
    await expect(counts.nth(2)).toContainText("Được2");
    await expect(counts.nth(3)).toContainText("Dễ1");
    await expect(page.getByTestId("send-status")).toHaveText("Đã lưu hết.");
    await axe(page);

    expect(submitted).toHaveLength(4);
    for (const r of submitted) {
      expect(r.review_id).toMatch(/^[0-9a-f-]{36}$/);
      expect(r.study_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Object.keys(r.state_after).sort()).toEqual(STATE_KEYS);
      expect(Object.keys(r.state_before).sort()).toEqual(STATE_KEYS);
      expect(r).not.toHaveProperty("user_id");
    }
    expect(new Set(submitted.map((r) => r.review_id)).size).toBe(4);
    expect(new Set(submitted.map((r) => r.session_id)).size).toBe(1);
    expect(submitted.map((r) => [r.card_id, r.rating])).toEqual([
      ["vocab:1", 3], ["kana:hira:i", 1], ["kanji:学", 4], ["kana:hira:i", 3],
    ]);
    // Lượt Lại lần hai dùng trạng thái sau lượt Lại đầu làm state_before.
    expect(submitted[3].state_before).toEqual(submitted[1].state_after);
    await page.getByRole("link", { name: "Về trang chính" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("hàng đợi rỗng: câu trung tính và liên kết về trang chính", async ({ page }) => {
    await openReview(page, { due: [], new_done_today: 0, new_candidates: [] });
    await expect(page.getByText("Hôm nay không còn thẻ cần ôn.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Về trang chính" })).toBeVisible();
    await axe(page);
  });

  test("lỗi mạng khi gửi: tổng kết báo còn lượt chưa gửi, sau đó tự gửi lại", async ({ page }) => {
    await mockLoggedInBackend(page);
    const { submitted, ctl } = await mockLearning(page, { ...queue3, new_candidates: [] });
    ctl.failSubmit = true;
    await loginViaForm(page);
    await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
    await flip(page);
    await page.keyboard.press("3");
    await expect(page.getByRole("heading", { name: "Xong rồi." })).toBeVisible();
    await expect(page.getByTestId("send-status")).toHaveText("Còn 1 lượt chưa gửi, sẽ thử lại.");
    expect(submitted).toHaveLength(0);

    ctl.failSubmit = false;
    await expect(page.getByTestId("send-status")).toHaveText("Đã lưu hết.", { timeout: 15_000 });
    expect(submitted).toHaveLength(1);
  });

  test("đăng xuất khi còn lượt chưa gửi: cảnh báo, Ở lại giữ nguyên, Vẫn đăng xuất thì rời", async ({ page }) => {
    await mockLoggedInBackend(page);
    const { ctl } = await mockLearning(page, { ...queue3, new_candidates: [] });
    ctl.failSubmit = true;
    await loginViaForm(page);
    await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
    await flip(page);
    await page.keyboard.press("3");
    await expect(page.getByTestId("send-status")).toHaveText("Còn 1 lượt chưa gửi, sẽ thử lại.");
    // Điều hướng trong ứng dụng (không tải lại) để hàng chờ trong bộ nhớ còn nguyên.
    await page.getByRole("link", { name: "Về trang chính" }).click();
    await page.getByRole("link", { name: "Cài đặt" }).click();
    await expect(page).toHaveURL(/\/cai-dat$/);

    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page.getByRole("alertdialog")).toContainText(
      "Còn 1 lượt ôn chưa gửi. Đăng xuất bây giờ sẽ mất các lượt này.",
    );
    await axe(page);
    await page.getByRole("button", { name: "Ở lại" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page).toHaveURL(/\/cai-dat$/);
    await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();

    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await page.getByRole("button", { name: "Vẫn đăng xuất" }).click();
    await expect(page).toHaveURL(/\/dang-nhap$/);
  });

  test("kanji thiếu Hán Việt và từ ví dụ", async ({ page }) => {
    await openReview(page, {
      due: [],
      new_done_today: 0,
      new_candidates: [
        {
          card: { id: "kanji:猫", kind: "kanji", level: "N4" },
          details: {
            kanji: "猫", han_viet_main: null, han_viet_other: [], han_viet_source: null,
            meaning_vi: "mèo", on_readings: ["ビョウ"], kun_readings: ["ねこ"], examples: [],
          },
        },
      ],
    });
    await flip(page);
    await expect(page.getByText("Đang bổ sung").first()).toBeVisible();
    await expect(page.getByText("Chưa có từ ví dụ")).toBeVisible();
    await axe(page);
  });

  test("không tràn ngang ở 375px với từ dài và thẻ kanji", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const long = structuredClone(queue3);
    (long.due[0].details as Record<string, unknown>).word = "新しい学生さん";
    await openReview(page, long);
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);
    await flip(page);
    expect(await overflow()).toBeLessThanOrEqual(0);
    await page.keyboard.press("3");
    await page.keyboard.press("Space");
    await page.keyboard.press("3");
    await page.keyboard.press("Space");
    expect(await overflow()).toBeLessThanOrEqual(0);
    await axe(page);
  });
});

const WIDTHS = [375, 1280, 1440];
const AXE_WIDTHS = [375, 1280];

test.describe("giao diện phiên ôn: không tràn, Klee One, axe mọi mặt", () => {
  for (const width of WIDTHS) {
    test(`thẻ vocab, kana, kanji, tổng kết ở ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 812 : 800 });
      await openReview(page, queue3);
      const overflow = () =>
        page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const checkAxe = AXE_WIDTHS.includes(width);

      // Thẻ 1: vocab. Mặt trước, mặt sau.
      await progress(page, "1 / 3");
      expect(await overflow()).toBeLessThanOrEqual(0);
      if (checkAxe) await axe(page);
      await flip(page);
      expect(await overflow()).toBeLessThanOrEqual(0);
      if (checkAxe) await axe(page);
      await page.keyboard.press("3");

      // Thẻ 2: kana.
      await progress(page, "2 / 3");
      await flip(page);
      expect(await overflow()).toBeLessThanOrEqual(0);
      if (checkAxe) await axe(page);
      await page.keyboard.press("3");

      // Thẻ 3: kanji, chữ lớn dùng Klee One ở cả hai mặt.
      await progress(page, "3 / 3");
      const bigFront = page.locator('p[lang="ja"]:visible').first();
      expect(await bigFront.evaluate((e) => getComputedStyle(e).fontFamily)).toMatch(/klee/i);
      expect(await bigFront.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(160);
      if (checkAxe) await axe(page);
      await flip(page);
      const bigBack = page.getByRole("group", { name: "Mặt sau của thẻ" }).locator('p[lang="ja"]').first();
      expect(await bigBack.evaluate((e) => getComputedStyle(e).fontFamily)).toMatch(/klee/i);
      expect(await overflow()).toBeLessThanOrEqual(0);
      if (checkAxe) await axe(page);
      for (const b of await page.locator("button[aria-keyshortcuts]").all()) {
        expect((await b.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      }
      await page.keyboard.press("3");

      await expect(page.getByRole("heading", { name: "Xong rồi." })).toBeVisible();
      await expect(page.getByRole("link", { name: "Làm trắc nghiệm" })).toHaveAttribute("href", "/trac-nghiem");
      expect(await overflow()).toBeLessThanOrEqual(0);
      if (checkAxe) await axe(page);
    });
  }
});

const kanaRows = [
  ["hira", "あ", "a", "basic", 1],
  ["hira", "い", "i", "basic", 2],
  ["hira", "が", "ga", "dakuten", 3],
  ["hira", "きゃ", "kya", "yoon", 4],
  ["kata", "ア", "a", "basic", 5],
  ["kata", "カ", "ka", "basic", 6],
].map(([script, kana, romaji, grp, sort_order]) => ({
  id: `kana:${script}:${romaji}`,
  sort_order,
  kana_details: { script, kana, romaji, grp },
}));

test.describe("bảng kana (S-09)", () => {
  test("tab bằng phím mũi tên, chọn chữ hiện romaji, axe sạch", async ({ page }) => {
    await mockLoggedInBackend(page);
    await page.route("**/rest/v1/cards**", (route) => route.fulfill({ json: kanaRows }));
    await loginViaForm(page);
    await page.getByRole("link", { name: "Bảng kana" }).click();
    await expect(page).toHaveURL(/\/kana$/);

    const hira = page.getByRole("tab", { name: "Hiragana" });
    const kata = page.getByRole("tab", { name: "Katakana" });
    await expect(hira).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: /Cơ bản/ })).toContainText("2 chữ");
    await expect(page.getByRole("heading", { name: /Âm đục/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Âm ghép/ })).toBeVisible();

    await page.getByRole("button", { name: "が, ga" }).click();
    await expect(page.getByTestId("kana-detail")).toContainText("ga");
    await expect(page.getByTestId("kana-detail")).toContainText("が");
    await axe(page);

    await hira.focus();
    await page.keyboard.press("ArrowRight");
    await expect(kata).toHaveAttribute("aria-selected", "true");
    await expect(kata).toBeFocused();
    await expect(page.getByRole("button", { name: "ア, a" })).toBeVisible();
    await expect(page.getByRole("button", { name: "あ, a" })).toHaveCount(0);
    await page.keyboard.press("ArrowLeft");
    await expect(hira).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(kata).toHaveAttribute("aria-selected", "true");

    await page.getByRole("button", { name: "カ, ka" }).click();
    await expect(page.getByTestId("kana-detail")).toContainText("ka");

    await page.setViewportSize({ width: 375, height: 812 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await axe(page);
  });
});
