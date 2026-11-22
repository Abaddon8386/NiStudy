import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SOURCES = [
  { name: "KANJIDIC2", licence: "CC BY-SA 4.0" },
  { name: "JMdict_e", licence: "CC BY-SA 4.0" },
  { name: "Danh sách kanji JLPT N5, N4 (tanos.co.uk)", licence: "CC BY (theo nguồn thứ cấp)" },
  { name: "Danh sách từ vựng JLPT N5, N4 (tanos.co.uk)", licence: "CC BY (theo nguồn thứ cấp)" },
];

test("không đăng nhập vẫn mở được; đủ 4 nguồn kèm giấy phép, ngày tải", async ({ page }) => {
  await page.goto("/nguon-du-lieu");
  await expect(page).toHaveURL(/\/nguon-du-lieu$/);
  await expect(page.getByRole("heading", { level: 1, name: "Nguồn dữ liệu" })).toBeVisible();
  const items = page.locator("main > ul > li");
  await expect(items).toHaveCount(4);
  for (const s of SOURCES) {
    const item = items.filter({ has: page.getByRole("heading", { level: 2, name: s.name, exact: true }) });
    await expect(item).toHaveCount(1);
    await expect(item).toContainText(`Giấy phép: ${s.licence}`);
    await expect(item).toContainText("Ngày tải: 18/11/2026");
    if (s.licence.startsWith("CC BY (")) await expect(item).toContainText("chưa đọc được trang gốc");
  }
  await expect(page.locator("main")).toContainText("MIT");
  await expect(page.locator("main")).toContainText("CC BY-SA 4.0, tách khỏi MIT");
  await expect(page.locator("main")).toContainText("không chính thức");
  await expect(page.getByRole("link", { name: "Đăng nhập" })).toBeVisible();
});

test("liên kết giấy phép đúng URL, liên kết ngoài có rel an toàn", async ({ page }) => {
  await page.goto("/nguon-du-lieu");
  const bySa = page.locator('a[href="https://creativecommons.org/licenses/by-sa/4.0/"]');
  const by = page.locator('a[href="https://creativecommons.org/licenses/by/4.0/"]');
  expect(await bySa.count()).toBeGreaterThanOrEqual(3); // KANJIDIC2, JMdict, đoạn dữ liệu tự biên soạn
  await expect(by).toHaveCount(3); // hai danh sách tanos + clip tàu (mục Hình ảnh và video)
  for (const a of await page.locator('main a[href^="http"]').all()) {
    await expect(a).toHaveAttribute("rel", /noopener/);
    await expect(a).toHaveAttribute("rel", /noreferrer/);
  }
});

test("offline sau khi service worker precache vẫn mở được", async ({ page, context }) => {
  await page.goto("/nguon-du-lieu");
  await page.waitForFunction(async () => {
    const name = (await caches.keys()).find((k) => k.startsWith("serwist-precache"));
    if (!name) return false;
    const urls = (await (await caches.open(name)).keys()).map((r) => new URL(r.url).pathname);
    return urls.includes("/nguon-du-lieu");
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Nguồn dữ liệu" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "KANJIDIC2" })).toBeVisible();
});

for (const [name, size] of [
  ["1280px", { width: 1280, height: 800 }],
  ["375px", { width: 375, height: 812 }],
] as const) {
  test(`axe 0 vi phạm, không tràn ngang ở ${name}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/nguon-du-lieu");
    await expect(page.getByRole("heading", { level: 1, name: "Nguồn dữ liệu" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(r.violations).toEqual([]);
  });
}
