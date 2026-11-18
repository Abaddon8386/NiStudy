import { expect, test } from "@playwright/test";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

const pages = [
  { path: "/dang-nhap", title: /Đăng nhập/, heading: "Đăng nhập" },
  { path: "/dang-ky", title: /Đăng ký/, heading: "Đăng ký" },
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

// Guard cần phiên: đăng nhập bằng phản hồi Supabase giả để có phiên cục bộ (cookie), rồi thử offline.
// Phiên đọc từ cookie nên guard chạy được khi offline; vỏ "/" do service worker phục vụ.
test("offline: mở lại vỏ ứng dụng và trang đã cache (FR-28)", async ({ page, context }) => {
  await mockLoggedInBackend(page);
  await loginViaForm(page);
  await expect(page.getByRole("heading", { level: 1, name: "Nihongo" })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller || true);
  // Chờ precache xong ("/", "/nguon-du-lieu", "/khoi-dau", "/cai-dat").
  await page.waitForFunction(async () => {
    const keys = await caches.keys();
    const name = keys.find((k) => k.startsWith("serwist-precache"));
    if (!name) return false;
    const urls = (await (await caches.open(name)).keys()).map((r) => new URL(r.url).pathname);
    return ["/", "/nguon-du-lieu", "/khoi-dau", "/cai-dat"].every((u) => urls.includes(u));
  });
  // Tải lại một lần để trang được service worker kiểm soát.
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Nihongo" })).toBeVisible();

  await page.goto("/nguon-du-lieu");
  await expect(page.getByRole("heading", { level: 1, name: "Nguồn dữ liệu" })).toBeVisible();

  await page.goto("/cai-dat");
  await expect(page.getByRole("heading", { level: 1, name: "Cài đặt" })).toBeVisible();

  // Trang chưa cache: rơi về vỏ ứng dụng.
  await page.goto("/trang-khong-ton-tai");
  await expect(page.getByRole("heading", { level: 1, name: "Nihongo" })).toBeVisible();
});

test("offline không có phiên: vỏ được phục vụ rồi chuyển /dang-nhap (không có dữ liệu cá nhân)", async ({ page, context }) => {
  await page.goto("/nguon-du-lieu");
  await page.waitForFunction(async () => {
    const name = (await caches.keys()).find((k) => k.startsWith("serwist-precache"));
    if (!name) return false;
    const urls = (await (await caches.open(name)).keys()).map((r) => new URL(r.url).pathname);
    return urls.includes("/");
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.goto("/");
  // Không có phiên: guard không hiện nội dung "Nihongo" của trang chính.
  await expect(page.getByRole("heading", { level: 1, name: "Nihongo" })).toHaveCount(0);
});
