import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

const sample = JSON.parse(readFileSync("tests/fixtures/queue-sample.json", "utf8")) as object;
const kanaRows = [
  { id: "kana:hira:a", sort_order: 1, kana_details: { script: "hira", kana: "あ", romaji: "a", grp: "basic" } },
];

for (const width of [1440, 1280, 375]) {
  test(`không tràn ngang ở ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 800 });
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
    for (const path of ["/", "/kana", "/trac-nghiem", "/cai-dat", "/cai-app"]) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(400);
      const { sw, iw } = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        iw: window.innerWidth,
      }));
      expect(sw, `${path} @${width}`).toBeLessThanOrEqual(iw);
    }
  });
}
