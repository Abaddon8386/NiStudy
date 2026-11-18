import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", title: /Nihongo/, heading: "Nihongo" },
  { path: "/nguon-du-lieu", title: /Nguồn dữ liệu/, heading: "Nguồn dữ liệu" },
];

for (const { path, title, heading } of pages) {
  test.describe(path, () => {
    test("lang=vi, tiêu đề đúng", async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", "vi");
      await expect(page).toHaveTitle(title);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    });

    test("không tràn ngang ở 375px", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}

test("trang nguồn dữ liệu nêu CC BY-SA, CC BY và MIT", async ({ page }) => {
  await page.goto("/nguon-du-lieu");
  const body = page.locator("main");
  await expect(body).toContainText("CC BY-SA");
  await expect(body).toContainText("Tatoeba");
  await expect(body).toContainText("MIT");
});

test("manifest và service worker được phục vụ", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).lang).toBe("vi");

  const sw = await request.get("/serwist/sw.js");
  expect(sw.ok()).toBe(true);
  expect(sw.headers()["service-worker-allowed"]).toBe("/");
});

test("service worker đăng ký và kích hoạt với phạm vi /", async ({ page }) => {
  await page.goto("/nguon-du-lieu");
  const scope = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.scope;
  });
  expect(scope).toBe("http://localhost:3100/");
});
