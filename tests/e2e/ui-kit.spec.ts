import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

interface Item {
  card: { id: string; kind: string };
  [k: string]: unknown;
}
const sample = JSON.parse(readFileSync("tests/fixtures/queue-sample.json", "utf8")) as {
  new_candidates: Item[];
  [k: string]: unknown;
};
/** Hàng chờ chỉ có một kanji mới để thẻ đầu tiên là thẻ kanji. */
const kanjiQueue = { ...sample, due: [], new_candidates: sample.new_candidates.filter((c) => c.card.kind === "kanji") };
const dashboard = {
  due_count: 5, new_done_today: 0, new_per_day: 10, review_limit: 100, streak: 0, total_days: 0,
  xp_total: 0, xp_today: 0, median_seconds_7d: null, exam_date: null, studied_today: false,
};

async function login(page: Page) {
  await mockLoggedInBackend(page);
  await page.route("**/rest/v1/rpc/get_today_queue", (route) => route.fulfill({ json: kanjiQueue }));
  await page.route("**/rest/v1/rpc/get_dashboard", (route) => route.fulfill({ json: dashboard }));
  await page.route("**/rest/v1/cards**", (route) => route.fulfill({ json: [] }));
  await loginViaForm(page);
  await expect(page.getByRole("link", { name: "Bắt đầu ôn" })).toBeVisible();
}
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("font kanji", () => {
  test("chữ kanji ở thẻ ôn dùng Klee One, không bị :lang(ja) đè", async ({ page }) => {
    await login(page);
    await page.goto("/on-tap");
    const kanji = page.locator(".flip-card .font-kanji").first();
    await expect(kanji).toBeVisible();
    const family = await kanji.evaluate((e) => getComputedStyle(e).fontFamily);
    expect(family).toMatch(/^["']?[^,]*klee/i);
  });
});

test.describe("nút", () => {
  test("nút primary trên nền sáng có nền ink, chữ trắng", async ({ page }) => {
    await page.goto("/dang-nhap");
    const btn = page.getByRole("button", { name: "Đăng nhập" });
    await expect(btn).toBeVisible();
    const css = await btn.evaluate((e) => {
      const s = getComputedStyle(e);
      return { bg: s.backgroundColor, color: s.color };
    });
    expect(css.bg).toBe("rgb(31, 32, 29)");
    expect(css.color).toBe("rgb(255, 255, 255)");
  });
});

for (const width of [360, 375]) {
  test.describe(`khung điện thoại ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("thanh đáy 4 mục, mỗi nhãn một dòng; Cài đặt nằm ở header", async ({ page }) => {
      await login(page);
      const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
      await expect(nav.getByRole("link")).toHaveText(["Hôm nay", "Ôn tập", "Kiểm tra", "Kana"]);
      for (const link of await nav.getByRole("link").all()) {
        const lines = await link.evaluate((el) => {
          const r = document.createRange();
          r.selectNodeContents(el);
          // Số dòng = số giá trị `top` khác nhau của các hộp chữ.
          return new Set(Array.from(r.getClientRects()).map((c) => Math.round(c.top))).size;
        });
        expect(lines).toBe(1);
        expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      }
      const header = page.locator("header").first();
      const settings = header.getByRole("link", { name: "Cài đặt" });
      await expect(settings).toBeVisible();
      expect((await settings.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    });
  });
}

for (const [label, viewport] of [
  ["375", { width: 375, height: 812 }],
  ["1280", { width: 1280, height: 800 }],
] as const) {
  test.describe(`màn auth ${label}px`, () => {
    test.use({ viewport });
    for (const path of ["/dang-nhap", "/dang-ky", "/quen-mat-khau", "/kiem-tra-hop-thu", "/dat-lai-mat-khau"]) {
      test(`${path}: axe A/AA sạch, không tràn ngang`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.waitForTimeout(900); // chờ chữ hero trồi xong để đo tương phản đúng
        const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
        expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
        expect(await overflow(page)).toBeLessThanOrEqual(0);
      });
    }
  });
}

test.describe("form auth tự kiểm, không dùng bong bóng trình duyệt", () => {
  test("đăng nhập để trống: lỗi dưới từng ô, không gửi request", async ({ page }) => {
    let calls = 0;
    await page.route("**/auth/v1/**", (route) => {
      calls++;
      return route.abort();
    });
    await page.goto("/dang-nhap");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page.getByText("Nhập email của bạn.")).toBeVisible();
    await expect(page.getByText("Nhập mật khẩu.")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
    expect(calls).toBe(0);
  });
});
