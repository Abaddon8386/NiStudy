import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

const sample = JSON.parse(readFileSync("tests/fixtures/queue-sample.json", "utf8")) as object;
const kanaRows = [
  { id: "kana:hira:a", sort_order: 1, kana_details: { script: "hira", kana: "あ", romaji: "a", grp: "basic" } },
  { id: "kana:hira:ga", sort_order: 2, kana_details: { script: "hira", kana: "が", romaji: "ga", grp: "dakuten" } },
];
const NAV_NAMES = ["Trang chính", "Ôn tập", "Trắc nghiệm", "Bảng kana", "Cài đặt"];
const BOTTOM_NAMES = ["Hôm nay", "Ôn tập", "Kiểm tra", "Kana"];

async function login(page: Page) {
  await mockLoggedInBackend(page);
  await page.route("**/rest/v1/rpc/get_today_queue", (route) => route.fulfill({ json: sample }));
  await page.route("**/rest/v1/rpc/get_dashboard", (route) =>
    route.fulfill({
      json: { due_count: 5, new_done_today: 0, new_per_day: 10, review_limit: 100, streak: 0, total_days: 0, xp_total: 0, xp_today: 0, median_seconds_7d: null, exam_date: null, studied_today: false },
    }),
  );
  await page.route("**/rest/v1/cards**", (route) => route.fulfill({ json: kanaRows }));
  await loginViaForm(page);
  await expect(page.getByRole("link", { name: "Bắt đầu ôn" })).toBeVisible();
}
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("khung điều hướng (máy tính 1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("thanh bên có 5 mục, aria-current theo trang đang mở", async ({ page }) => {
    await login(page);
    const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
    await expect(nav).toHaveCount(1);
    await expect(nav.getByRole("link")).toHaveText(NAV_NAMES);
    await expect(nav.getByRole("link", { name: "Trang chính" })).toHaveAttribute("aria-current", "page");
    await expect(nav.locator("[aria-current]")).toHaveCount(1);
    expect((await nav.boundingBox())?.width).toBeLessThanOrEqual(224);

    await nav.getByRole("link", { name: "Bảng kana" }).click();
    await expect(page).toHaveURL(/\/kana$/);
    await expect(nav.getByRole("link", { name: "Bảng kana" })).toHaveAttribute("aria-current", "page");
    await expect(nav.locator("[aria-current]")).toHaveCount(1);

    await nav.getByRole("link", { name: "Cài đặt" }).click();
    await expect(page).toHaveURL(/\/cai-dat$/);
    await expect(nav.getByRole("link", { name: "Cài đặt" })).toHaveAttribute("aria-current", "page");
  });

  test("/on-tap: chế độ tập trung, cột ≤ 640px, có gợi ý phím tắt", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
    await expect(page).toHaveURL(/\/on-tap$/);
    await expect(page.getByRole("button", { name: /Lật thẻ/ })).toBeVisible();
    await expect(page.getByRole("navigation")).toHaveCount(0);
    const main = await page.locator("main").boundingBox();
    expect(main?.width).toBeLessThanOrEqual(640);
    const card = await page.locator(".flip-card").boundingBox();
    expect(card?.width).toBeLessThanOrEqual(640);
    const hint = page.getByTestId("shortcut-hint");
    await expect(hint).toBeVisible();
    await expect(hint).toContainText("Space");
    await expect(hint).toContainText("Được");
  });

  for (const path of ["/", "/cai-dat", "/kana"]) {
    test(`axe ${path} không có vi phạm A/AA`, async ({ page }) => {
      await login(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForTimeout(400);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
    });
  }

  test("axe /on-tap không có vi phạm A/AA", async ({ page }) => {
    await login(page);
    await page.goto("/on-tap");
    await expect(page.getByRole("button", { name: /Lật thẻ/ })).toBeVisible();
    await page.waitForTimeout(700);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
  });
});

test.describe("khung điều hướng (điện thoại 375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("thanh điều hướng đáy 4 mục, vùng bấm ≥ 44px, không tràn ngang", async ({ page }) => {
    await login(page);
    const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
    await expect(nav).toHaveCount(1);
    await expect(nav).toBeVisible();
    const links = nav.getByRole("link");
    await expect(links).toHaveText(BOTTOM_NAMES);
    for (const l of await links.all()) {
      const box = await l.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
    await expect(nav.getByRole("link", { name: "Hôm nay" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Cài đặt" })).toBeVisible();
    const navBox = await nav.boundingBox();
    expect(Math.round((navBox?.y ?? 0) + (navBox?.height ?? 0))).toBe(812);
    for (const path of ["/", "/kana", "/cai-dat"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    }
  });

  test("/on-tap không hiện điều hướng chung", async ({ page }) => {
    await login(page);
    await page.goto("/on-tap");
    await expect(page.getByRole("button", { name: /Lật thẻ/ })).toBeVisible();
    await expect(page.getByRole("navigation")).toHaveCount(0);
    await expect(page.getByTestId("shortcut-hint")).toBeHidden();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
});
