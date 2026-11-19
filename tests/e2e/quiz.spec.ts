import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

const vocabIds = Array.from({ length: 16 }, (_, i) => `vocab:${i}`);
const kanjiIds = Array.from({ length: 8 }, (_, i) => `kanji:${i}`);
const cardRows = [
  ...vocabIds.map((id) => ({ id, kind: "vocab", level: "N5" })),
  ...kanjiIds.map((id) => ({ id, kind: "kanji", level: "N5" })),
  { id: "kana:hira:a", kind: "kana", level: "N5" },
];
const vocabRows = vocabIds.map((id, i) => ({
  card_id: id,
  word: `語${i}`,
  reading: `ご${i}`,
  meaning_vi: `nghĩa ${i}`,
}));
const kanjiRows = kanjiIds.map((id, i) => ({
  card_id: id,
  kanji: `漢${i}`,
  han_viet_main: `âm${i}`,
  meaning_vi: `ý ${i}`,
}));
const ALL_LEARNED = [...vocabIds.slice(0, 8), ...kanjiIds.slice(0, 4)].map((card_id) => ({ card_id }));

/** Đáp án đúng cho một đề (đề là duy nhất trong dữ liệu mẫu). */
function expectedAnswer(prompt: string): string {
  const v = vocabRows.find((r) => r.word === prompt);
  if (v) return v.meaning_vi;
  const m = vocabRows.find((r) => r.meaning_vi === prompt);
  if (m) return m.word;
  const k = kanjiRows.find((r) => r.kanji === prompt);
  if (k) return k.han_viet_main.toUpperCase();
  throw new Error(`đề lạ: ${prompt}`);
}

interface Ctl {
  submits: Record<string, unknown>[];
  /** Số lần submit_quiz đầu tiên bị lỗi mạng. */
  failSubmits: number;
  requests: string[];
}

async function setup(page: Page, learned: { card_id: string }[] = ALL_LEARNED): Promise<Ctl> {
  const ctl: Ctl = { submits: [], failSubmits: 0, requests: [] };
  page.on("request", (r) => ctl.requests.push(r.url()));
  await mockLoggedInBackend(page);
  await page.route("**/rest/v1/card_states**", (r) => r.fulfill({ json: learned }));
  await page.route("**/rest/v1/cards**", (r) => r.fulfill({ json: cardRows }));
  await page.route("**/rest/v1/vocab_details**", (r) => r.fulfill({ json: vocabRows }));
  await page.route("**/rest/v1/kanji_details**", (r) => r.fulfill({ json: kanjiRows }));
  await page.route("**/rest/v1/rpc/submit_quiz", (r) => {
    if (ctl.failSubmits > 0) {
      ctl.failSubmits--;
      return r.abort("failed");
    }
    ctl.submits.push(JSON.parse(r.request().postData() ?? "{}") as Record<string, unknown>);
    return r.fulfill({ contentType: "application/json", body: JSON.stringify("accepted") });
  });
  return ctl;
}

async function openQuiz(page: Page) {
  await loginViaForm(page);
  await expect(page).toHaveURL(/\/($|\?)|\/khoi-dau/);
  await page.goto("/trac-nghiem");
}

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
async function axe(page: Page) {
  await page.waitForTimeout(1300); // chờ hiện dần/đếm số xong
  const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
}

/** Trả lời câu hiện tại bằng phím; `wrong` true thì chọn một đáp án sai. Trả về đáp án đúng. */
async function answer(page: Page, wrong: boolean) {
  const prompt = (await page.getByTestId("quiz-prompt").innerText()).trim();
  const right = expectedAnswer(prompt);
  const texts = (await page.getByTestId("opt-text").allInnerTexts()).map((t) => t.trim());
  const ri = texts.indexOf(right);
  expect(ri, `đáp án đúng của "${prompt}" phải nằm trong lựa chọn`).toBeGreaterThanOrEqual(0);
  expect(new Set(texts).size).toBe(4);
  const pick = wrong ? (ri + 1) % 4 : ri;
  await page.keyboard.press(String(pick + 1));
  const fb = page.getByTestId("answer-feedback");
  if (wrong) {
    await expect(fb).toContainText("Sai");
    await expect(fb).toContainText(right);
    await expect(fb).toHaveAttribute("aria-live", "assertive");
  } else {
    await expect(fb).toContainText("Đúng");
  }
  return { right, texts };
}

test.describe("trắc nghiệm (máy tính 1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("làm đủ 10 câu bằng phím, gửi submit_quiz đúng, không đụng submit_reviews", async ({ page }) => {
    const ctl = await setup(page);
    await openQuiz(page);
    await expect(page.getByTestId("quiz-prompt")).toBeVisible();
    await expect(page.getByRole("navigation")).toHaveCount(0);
    expect((await page.locator("main").boundingBox())?.width).toBeLessThanOrEqual(640);
    await expect(page.getByTestId("shortcut-hint")).toContainText("Enter");
    await axe(page);

    const wrongAt = new Set([2, 6]);
    for (let i = 0; i < 10; i++) {
      await expect(page.getByText(`${i + 1} / 10`)).toBeVisible();
      await expect(page.locator("button[aria-keyshortcuts]")).toHaveCount(4);
      const { right } = await answer(page, wrongAt.has(i));
      if (i === 2) {
        // Sau khi trả lời: nút khóa, đáp án đúng được đánh dấu, axe sạch.
        await expect(page.getByRole("button", { name: /Đáp án đúng/ })).toContainText(right);
        await axe(page);
      }
      // Đã khóa: bấm phím khác không đổi đáp án.
      await page.keyboard.press("1");
      await page.keyboard.press("Enter");
    }

    await expect(page.getByRole("heading", { level: 1, name: "Xong bài" })).toBeVisible();
    await expect(page.getByTestId("quiz-score")).toContainText("8/10");
    await expect(page.getByTestId("quiz-xp")).toHaveText("+8 XP");
    await expect(page.getByTestId("wrong-list").getByRole("listitem")).toHaveCount(2);
    await expect(page.getByTestId("save-status")).toContainText("Đã lưu");
    await expect(page.getByRole("link", { name: "Về trang chính" })).toBeVisible();
    await axe(page);

    expect(ctl.submits).toHaveLength(1);
    expect(ctl.submits[0].p_correct).toBe(8);
    expect(ctl.submits[0].p_quiz_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(ctl.submits[0].p_study_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(ctl.requests.filter((u) => u.includes("submit_reviews"))).toEqual([]);
    expect(ctl.requests.some((u) => u.includes("review_logs"))).toBe(false);

    // "Làm bài khác": bài mới, quiz_id mới.
    await page.getByRole("button", { name: "Làm bài khác" }).click();
    await expect(page.getByTestId("quiz-prompt")).toBeVisible();
    await expect(page.getByText("1 / 10")).toBeVisible();
  });

  test("chỉ gửi bằng phương thức đọc cho card_states và không ghi bảng nào", async ({ page }) => {
    const writes: string[] = [];
    await setup(page);
    page.on("request", (r) => {
      if (r.url().includes("/rest/v1/") && r.method() !== "GET" && r.method() !== "HEAD" && !r.url().includes("submit_quiz") && !r.url().includes("rpc/get_"))
        writes.push(`${r.method()} ${r.url()}`);
    });
    await openQuiz(page);
    for (let i = 0; i < 10; i++) {
      await answer(page, false);
      await page.keyboard.press("Enter");
    }
    await expect(page.getByTestId("quiz-score")).toContainText("10/10");
    await expect(page.getByTestId("save-status")).toContainText("Đã lưu");
    expect(writes.filter((w) => !w.includes("/profiles"))).toEqual([]);
  });

  test("dưới 10 câu hợp lệ: không mở bài, mời học thêm", async ({ page }) => {
    const ctl = await setup(page, ALL_LEARNED.slice(0, 9));
    await openQuiz(page);
    await expect(page.getByTestId("not-enough")).toContainText("cần ít nhất 10 câu, hiện có 9");
    await expect(page.getByRole("link", { name: "Ôn tập" })).toHaveAttribute("href", "/on-tap");
    await expect(page.getByTestId("quiz-prompt")).toHaveCount(0);
    await axe(page);
    expect(ctl.submits).toEqual([]);
  });

  test("tải dữ liệu lỗi: báo cần kết nối mạng, không mở bài", async ({ page }) => {
    await setup(page);
    await page.route("**/rest/v1/vocab_details**", (r) => r.abort("failed"));
    await openQuiz(page);
    // supabase-js thử lại yêu cầu GET vài lần trước khi báo lỗi, tối đa 10 giây thì app tự bỏ cuộc.
    await expect(page.getByRole("alert").filter({ hasText: "Trắc nghiệm" })).toContainText("Trắc nghiệm cần kết nối mạng", {
      timeout: 15_000,
    });
    await expect(page.getByTestId("quiz-prompt")).toHaveCount(0);
  });

  test("trình duyệt báo offline: báo cần mạng, không tải dữ liệu", async ({ page }) => {
    const ctl = await setup(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });
    });
    await openQuiz(page);
    await expect(page.getByRole("alert").filter({ hasText: "Trắc nghiệm" })).toContainText("Trắc nghiệm cần kết nối mạng");
    await expect(page.getByTestId("quiz-prompt")).toHaveCount(0);
    expect(ctl.requests.filter((u) => u.includes("vocab_details") || u.includes("card_states"))).toEqual([]);
    await axe(page);
  });

  test("submit lỗi: giữ kết quả, 'Chưa lưu được', Thử lại cùng quiz_id thì thành công", async ({ page }) => {
    const ctl = await setup(page);
    ctl.failSubmits = 1;
    const ids: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("rpc/submit_quiz")) ids.push((JSON.parse(r.postData() ?? "{}") as { p_quiz_id: string }).p_quiz_id);
    });
    await openQuiz(page);
    for (let i = 0; i < 10; i++) {
      await answer(page, i === 0);
      await page.keyboard.press("Enter");
    }
    await expect(page.getByTestId("quiz-score")).toContainText("9/10");
    await expect(page.getByTestId("save-status")).toContainText("Chưa lưu được");
    expect(ctl.submits).toEqual([]);
    await page.getByRole("button", { name: "Thử lại" }).click();
    await expect(page.getByTestId("save-status")).toContainText("Đã lưu");
    expect(ctl.submits).toHaveLength(1);
    expect(ctl.submits[0].p_correct).toBe(9);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
  });

  test("bỏ dở giữa chừng: không gửi gì", async ({ page }) => {
    const ctl = await setup(page);
    await openQuiz(page);
    await answer(page, false);
    await page.keyboard.press("Enter");
    await answer(page, true);
    await page.getByRole("link", { name: "Thoát" }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(ctl.submits).toEqual([]);
    expect(ctl.requests.some((u) => u.includes("submit_quiz"))).toBe(false);
  });
});

test.describe("trắc nghiệm (điện thoại 375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("không tràn ngang, vùng bấm ≥ 44px, axe sạch", async ({ page }) => {
    await setup(page);
    await openQuiz(page);
    await expect(page.getByTestId("quiz-prompt")).toBeVisible();
    await expect(page.getByTestId("shortcut-hint")).toBeHidden();
    for (const b of await page.locator("button[aria-keyshortcuts]").all()) {
      expect((await b.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
    const over = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await over()).toBeLessThanOrEqual(0);
    await axe(page);
    await answer(page, true);
    await axe(page);
    expect(await over()).toBeLessThanOrEqual(0);
  });

  test("màn kết quả: không tràn ngang, axe sạch", async ({ page }) => {
    await setup(page);
    await openQuiz(page);
    for (let i = 0; i < 10; i++) {
      await answer(page, i < 2);
      await page.keyboard.press("Enter");
    }
    await expect(page.getByTestId("quiz-score")).toContainText("8/10");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await axe(page);
  });
});
