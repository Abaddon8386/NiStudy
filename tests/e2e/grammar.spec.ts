import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginViaForm as loginRaw, mockLoggedInBackend } from "./helpers";

// Chờ đăng nhập xong (về trang chính) trước khi sang trang khác, tránh đua với goto.
async function loginViaForm(page: Page) {
  await loginRaw(page);
  await expect(page).toHaveURL(/\/$/);
}

const point = (point_id: string, sort: number, title: string, extra: object = {}) => ({
  point_id,
  level: "N5",
  sort,
  title,
  pattern: "N1 は N2 です",
  meaning_vi: `Nghĩa của ${title}`,
  explanation: [
    { heading: "Cách dùng", body: "Dùng để nói A là B." },
    { body: "Thêm một đoạn giải thích." },
  ],
  notes: ["Trợ từ は đọc là wa."],
  examples: [
    { ja: "私は学生です。", ruby: "私[わたし]は学生[がくせい]です。", vi: "Tôi là sinh viên." },
    { ja: "これはペンです。", ruby: "これはペンです。", vi: "Đây là cái bút." },
  ],
  exercises: [
    { type: "cloze", prompt_ja: "私＿＿学生です。", answer: "は", choices: ["は", "が", "を", "に"], vi: "Tôi là sinh viên." },
    { type: "cloze", prompt_ja: "これ＿＿本です。", answer: "は", choices: ["を", "は", "で", "と"], vi: "Đây là quyển sách." },
  ],
  ...extra,
});

// Trả về không theo thứ tự `sort` để kiểm tra client tự sắp.
const POINTS = [
  point("ka-question", 3, "〜ですか"),
  point("wa-desu", 1, "AはBです"),
  point("no-possessive", 2, "AのB"),
];
// Dòng như PostgREST trả cho truy vấn embed `cards!inner(published)`.
const row = (p: (typeof POINTS)[number]) => ({ ...p, card_id: `grammar:${p.point_id}`, cards: { published: true } });

interface Ctl {
  submitReviews: number;
  submitQuiz: number;
  reviewed: string[];
}

async function mockGrammar(
  page: Page,
  opts: { points?: (typeof POINTS)[number][]; failDetails?: boolean; queue?: object } = {},
): Promise<Ctl> {
  const ctl: Ctl = { submitReviews: 0, submitQuiz: 0, reviewed: [] };
  await mockLoggedInBackend(page);
  await page.route("**/rest/v1/grammar_details**", (r) => {
    if (opts.failDetails) return r.fulfill({ status: 500, json: { message: "boom" } });
    const url = new URL(r.request().url());
    // Truy vấn thật chỉ lấy điểm đã duyệt.
    expect(url.searchParams.get("cards.published")).toBe("eq.true");
    let rows = (opts.points ?? POINTS).map(row);
    const pid = url.searchParams.get("point_id");
    if (pid) rows = rows.filter((x) => `eq.${x.point_id}` === pid);
    const lv = url.searchParams.get("level");
    if (lv) rows = rows.filter((x) => `eq.${x.level}` === lv);
    rows.sort((a, b) => a.sort - b.sort);
    const single = (r.request().headers()["accept"] ?? "").includes("vnd.pgrst.object");
    if (single) {
      return rows[0]
        ? r.fulfill({ contentType: "application/vnd.pgrst.object+json", json: rows[0] })
        : r.fulfill({ status: 406, contentType: "application/json", json: { code: "PGRST116", message: "0 rows" } });
    }
    return r.fulfill({ json: rows });
  });
  await page.route("**/rest/v1/card_states**", (r) => r.fulfill({ json: [{ card_id: "grammar:wa-desu" }] }));
  await page.route("**/rest/v1/rpc/get_today_queue", (r) =>
    r.fulfill({ json: opts.queue ?? { due: [], new_done_today: 0, new_candidates: [] } }),
  );
  await page.route("**/rest/v1/rpc/submit_reviews", (r) => {
    ctl.submitReviews++;
    const body = JSON.parse(r.request().postData() ?? "{}") as { p_reviews: { review_id: string; card_id: string }[] };
    ctl.reviewed.push(...body.p_reviews.map((x) => x.card_id));
    return r.fulfill({ json: body.p_reviews.map((x) => ({ review_id: x.review_id, status: "accepted" })) });
  });
  await page.route("**/rest/v1/rpc/submit_quiz", (r) => {
    ctl.submitQuiz++;
    return r.fulfill({ json: {} });
  });
  return ctl;
}

const axe = async (page: Page) => {
  await page.waitForTimeout(700);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
};
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const [w, h] of [
  [1280, 800],
  [375, 812],
] as const) {
  test(`danh sách ngữ pháp ${w}px: theo sort, nhãn Đã học, N4 sắp có, axe sạch`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await mockGrammar(page);
    await loginViaForm(page);
    await page.goto("/ngu-phap");
    await expect(page.getByRole("heading", { name: "Ngữ pháp", level: 1 })).toBeVisible();

    const items = page.getByRole("tabpanel").getByRole("listitem");
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText("AはBです");
    await expect(items.nth(1)).toContainText("AのB");
    await expect(items.nth(2)).toContainText("〜ですか");
    await expect(items.nth(0)).toContainText("Đã học");
    await expect(items.nth(1)).not.toContainText("Đã học");
    await expect(items.nth(0)).toContainText("N1 は N2 です");
    await expect(items.nth(0)).toContainText("Nghĩa của AはBです");
    const box = (await items.nth(0).getByRole("link").boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);

    await axe(page);
    expect(await overflow(page)).toBeLessThanOrEqual(0);

    await page.getByRole("tab", { name: /N4/ }).click();
    await expect(page.getByText("Ngữ pháp N4 sắp có")).toBeVisible();
  });
}

test("không tràn ngang ở 1440px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockGrammar(page);
  await loginViaForm(page);
  await page.goto("/ngu-phap");
  await expect(page.getByRole("tabpanel").getByRole("listitem")).toHaveCount(3);
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await page.goto("/ngu-phap/wa-desu");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("AはBです");
  expect(await overflow(page)).toBeLessThanOrEqual(0);
});

test("chưa có bài đã duyệt: trạng thái rỗng", async ({ page }) => {
  await mockGrammar(page, { points: [] });
  await loginViaForm(page);
  await page.goto("/ngu-phap");
  await expect(page.getByText("Bài ngữ pháp đang được soạn")).toBeVisible();
  await axe(page);
});

test("lỗi mạng khi tải danh sách: báo lỗi và có nút Thử lại", async ({ page }) => {
  await mockGrammar(page, { failDetails: true });
  await loginViaForm(page);
  await page.goto("/ngu-phap");
  await expect(page.getByRole("alert").filter({ hasText: "Chưa tải được danh sách ngữ pháp" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
});

test("thanh bên máy tính có Ngữ pháp, thanh đáy điện thoại giữ 4 mục", async ({ page }) => {
  await mockGrammar(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginViaForm(page);
  await page.goto("/ngu-phap");
  await expect(page.getByRole("link", { name: "Ngữ pháp", exact: true })).toHaveAttribute("aria-current", "page");
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator("nav[aria-label='Điều hướng chính']:visible a")).toHaveCount(4);
});

for (const [w, h] of [
  [1280, 800],
  [375, 812],
] as const) {
  test(`bài chi tiết ${w}px: furigana bật/tắt, luyện tập đúng/sai, không gọi RPC ghi`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const ctl = await mockGrammar(page);
    await loginViaForm(page);
    await page.goto("/ngu-phap/wa-desu");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("AはBです");
    await expect(page.getByText("Nghĩa của AはBです")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cách dùng" })).toBeVisible();
    await expect(page.getByText("Trợ từ は đọc là wa.")).toBeVisible();
    await expect(page.getByText("Tôi là sinh viên.").first()).toBeVisible();

    // Furigana
    await expect(page.locator("ruby rt").first()).toHaveText("わたし");
    await expect(page.locator("ruby").first()).toBeVisible();
    await page.getByRole("button", { name: /Furigana/ }).click();
    await expect(page.locator("ruby")).toHaveCount(0);
    await expect(page.getByText("私は学生です。").first()).toBeVisible();
    await page.getByRole("button", { name: /Furigana/ }).click();
    await expect(page.locator("ruby").first()).toBeVisible();

    // Luyện tập: câu 1 sai, câu 2 đúng
    const g1 = page.getByRole("group", { name: "Đáp án câu 1" });
    // Thứ tự lựa chọn được xáo: qua nhiều câu/bài, đáp án "は" không luôn đứng đầu.
    const firsts = await page.locator('[role="group"][aria-label^="Đáp án câu"]').evaluateAll((gs) =>
      gs.map((g) => g.querySelector("button")?.textContent),
    );
    expect(firsts).toHaveLength(2);
    await g1.getByRole("button", { name: "が" }).click();
    await expect(page.getByText(/✕ Sai\. Đáp án:/)).toContainText("私は学生です。");
    await expect(g1.getByRole("button", { name: /✓ は/ })).toBeVisible();
    await expect(g1.getByRole("button").first()).toBeDisabled();
    expect(await page.getByRole("button", { name: "が" }).evaluate((b) => b.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await expect(page.getByText(/Đúng \d\/2 câu/)).toHaveCount(0);

    const g2 = page.getByRole("group", { name: "Đáp án câu 2" });
    await g2.getByRole("button", { name: "は" }).click();
    await expect(page.getByText("✓ Đúng", { exact: true })).toBeVisible();
    await expect(page.getByText("Đúng 1/2 câu")).toBeVisible();
    await axe(page);

    await page.getByRole("button", { name: "Làm lại" }).click();
    await expect(page.getByText("Đúng 1/2 câu")).toHaveCount(0);
    await expect(g1.getByRole("button", { name: "が" })).toBeEnabled();

    // Trước/sau
    await expect(page.getByRole("link", { name: /Bài trước/ })).toHaveCount(0);
    await page.getByRole("link", { name: /Bài sau/ }).click();
    await expect(page).toHaveURL(/\/ngu-phap\/no-possessive$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("AのB");
    await expect(page.getByRole("link", { name: /Bài trước/ })).toBeVisible();
    await page.getByRole("link", { name: "Về danh sách" }).last().click();
    await expect(page).toHaveURL(/\/ngu-phap$/);

    expect(ctl.submitReviews).toBe(0);
    expect(ctl.submitQuiz).toBe(0);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
}

test("bài không tồn tại: báo không tìm thấy", async ({ page }) => {
  await mockGrammar(page);
  await loginViaForm(page);
  await page.goto("/ngu-phap/khong-co");
  await expect(page.getByText("Không tìm thấy bài này")).toBeVisible();
});

const state = (reps: number) => ({
  due: "2026-11-17T22:00:00+00:00",
  stability: 2.5,
  difficulty: 5,
  elapsed_days: 1,
  scheduled_days: 1,
  learning_steps: 0,
  reps,
  lapses: 0,
  state: 2,
  last_review: "2026-11-16T22:00:00+00:00",
});
const one = (id: string, sort: number, title: string) =>
  point(id, sort, title, {
    exercises: [
      { type: "cloze", prompt_ja: "私＿＿学生です。", answer: "は", choices: ["は", "が", "を", "に"], vi: "Tôi là sinh viên." },
    ],
  });

test("phiên ôn: thẻ đã học là câu điền, thẻ mới có bài học ngắn; mặt sau đúng; chấm bằng RPC thường", async ({ page }) => {
  const learned = one("wa-desu", 1, "AはBです");
  const fresh = one("no-possessive", 2, "AのB");
  const ctl = await mockGrammar(page, {
    queue: {
      due: [{ card: { id: "grammar:wa-desu", kind: "grammar", level: "N5" }, details: learned, state: state(2) }],
      new_done_today: 0,
      new_candidates: [{ card: { id: "grammar:no-possessive", kind: "grammar", level: "N5" }, details: fresh }],
    },
  });
  await loginViaForm(page);
  await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
  await expect(page).toHaveURL(/\/on-tap$/);

  // Thẻ đã học
  await expect(page.getByTestId("grammar-cloze")).toBeVisible();
  await expect(page.getByTestId("grammar-lesson")).toHaveCount(0);
  await expect(page.getByText("Gợi ý: Tôi là sinh viên.")).toBeVisible();
  await axe(page);
  await page.keyboard.press("Space");
  await expect(page.getByTestId("grammar-answer")).toContainText("私は学生です。");
  await expect(page.getByTestId("grammar-answer").locator(".ui-mark")).toHaveText("は");
  await expect(page.getByText("N1 は N2 です").last()).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem bài" })).toHaveAttribute("href", "/ngu-phap/wa-desu");
  await axe(page);
  await page.keyboard.press("3");

  // Thẻ mới: bài học ngắn rồi câu điền
  await expect(page.getByText("Thẻ mới")).toBeVisible();
  await expect(page.getByTestId("grammar-lesson")).toContainText("AのB");
  await expect(page.locator("[data-testid=grammar-lesson] ruby rt").first()).toHaveText("わたし");
  await expect(page.getByTestId("grammar-cloze")).toBeVisible();
  await axe(page);
  await page.keyboard.press("Space");
  await expect(page.getByTestId("grammar-answer")).toContainText("私は学生です。");
  await expect(page.getByRole("link", { name: "Xem bài" })).toHaveAttribute("href", "/ngu-phap/no-possessive");
  await page.keyboard.press("4");

  await expect(page.getByRole("heading", { name: "Xong rồi." })).toBeVisible();
  await expect.poll(() => ctl.reviewed.length).toBe(2);
  expect(ctl.reviewed).toEqual(["grammar:wa-desu", "grammar:no-possessive"]);
});
