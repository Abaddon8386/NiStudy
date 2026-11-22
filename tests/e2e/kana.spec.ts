import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

// Hàng ka thiếu ki/ku/ke/ko, hàng ya chỉ có ya và yo: ô trống phải giữ đúng vị trí cột.
const rows = [
  ["hira", "あ", "a", "basic", 1],
  ["hira", "お", "o", "basic", 2],
  ["hira", "か", "ka", "basic", 3],
  ["hira", "や", "ya", "basic", 4],
  ["hira", "よ", "yo", "basic", 5],
  ["hira", "ぢ", "ji", "dakuten", 6],
  ["hira", "じ", "ji", "dakuten", 7],
  ["hira", "きゅ", "kyu", "yoon", 8],
  ["kata", "ア", "a", "basic", 9],
].map(([script, kana, romaji, grp, sort_order]) => ({
  id: `kana:${script}:${kana}`,
  sort_order,
  kana_details: { script, kana, romaji, grp },
}));

for (const [w, h] of [
  [1280, 800],
  [375, 812],
] as const) {
  test(`bảng kana ${w}px: lưới theo hàng vần, ô trống đúng chỗ, chi tiết, axe sạch`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await mockLoggedInBackend(page);
    await page.route("**/rest/v1/cards**", (route) => route.fulfill({ json: rows }));
    await loginViaForm(page);
    await page.goto("/kana");
    await expect(page.getByRole("button", { name: "あ, a" })).toBeVisible();

    const box = async (name: string) => (await page.getByRole("button", { name }).boundingBox())!;
    const a = await box("あ, a");
    const o = await box("お, o");
    const ka = await box("か, ka");
    const ya = await box("や, ya");
    const yo = await box("よ, yo");
    expect(Math.abs(ka.x - a.x)).toBeLessThan(2); // か cùng cột あ, hàng dưới
    expect(ka.y).toBeGreaterThan(a.y + 20);
    expect(Math.abs(o.x - yo.x)).toBeLessThan(2); // お và よ cùng cột thứ 5
    expect(Math.abs(ya.x - a.x)).toBeLessThan(2); // や ở cột 1, ゆ trống giữa や và よ
    expect(yo.x - ya.x).toBeGreaterThan(ya.width * 3.5);
    expect(a.width).toBeGreaterThanOrEqual(44);
    expect(a.height).toBeGreaterThanOrEqual(56);

    // じ/ぢ cùng romaji "ji" nhưng nằm đúng ô riêng: ぢ ở hàng da, じ ở hàng za.
    const ji1 = await box("じ, ji");
    const ji2 = await box("ぢ, ji");
    expect(ji2.y).toBeGreaterThan(ji1.y);

    await page.getByRole("button", { name: "か, ka" }).click();
    const detail = page.getByTestId("kana-detail");
    await expect(detail).toContainText("ka");
    const kana = await detail.locator('[lang="ja"]').boundingBox();
    expect(kana!.height).toBeGreaterThanOrEqual(80);

    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
