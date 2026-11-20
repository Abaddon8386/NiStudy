import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

async function openInstall(page: Page) {
  await mockLoggedInBackend(page);
  await loginViaForm(page);
  await expect(page.getByRole("link", { name: "Bắt đầu ôn" })).toBeVisible();
  await page.goto("/cai-app");
  await expect(page.getByRole("heading", { level: 1, name: "Cài ứng dụng" })).toBeVisible({ timeout: 15_000 });
}

test("manifest đủ điều kiện cài", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m).toMatchObject({
    id: "/",
    name: expect.any(String),
    short_name: "Nihongo",
    description: expect.stringMatching(/[À-ỹ]/),
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "vi",
    background_color: expect.stringMatching(/^#/),
    theme_color: expect.stringMatching(/^#/),
  });
  const sizes = m.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  for (const i of m.icons as { src: string }[]) {
    expect((await request.get(i.src)).ok()).toBe(true);
  }
});

test("beforeinstallprompt: hiện nút Cài ứng dụng và gọi prompt()", async ({ page }) => {
  await openInstall(page);
  await page.evaluate(() => {
    const ev = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: string }>;
    };
    (window as unknown as { __prompted: number }).__prompted = 0;
    ev.prompt = async () => {
      (window as unknown as { __prompted: number }).__prompted++;
    };
    ev.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(ev);
  });
  const button = page.getByRole("button", { name: "Cài ứng dụng" });
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __prompted: number }).__prompted)).toBe(1);
  await expect(page.getByText("Đã cài. Mở Nihongo từ màn hình chính")).toBeVisible();
  await expect(button).toHaveCount(0);
});

test("beforeinstallprompt bắn ở trang khác vẫn được giữ cho /cai-app", async ({ page }) => {
  await mockLoggedInBackend(page);
  await loginViaForm(page);
  await expect(page.getByRole("link", { name: "Bắt đầu ôn" })).toBeVisible();
  await page.evaluate(() => {
    const ev = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: string }>;
    };
    ev.prompt = async () => {};
    ev.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(ev);
  });
  await page.getByRole("navigation", { name: "Điều hướng chính" }).filter({ visible: true }).getByRole("link", { name: "Cài đặt" }).click();
  await page.getByRole("link", { name: "Cài ứng dụng lên thiết bị" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Cài ứng dụng" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Cài ứng dụng" })).toBeVisible();
});

test("sự kiện appinstalled: báo đã cài", async ({ page }) => {
  await openInstall(page);
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(page.getByText("Đã cài xong Nihongo.")).toBeVisible();
});

test.describe("iPhone Safari", () => {
  test.use({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  });

  test("thấy các bước Thêm vào Màn hình chính", async ({ page }) => {
    await openInstall(page);
    const status = page.getByRole("status");
    await expect(status).toContainText("Cài trên iPhone/iPad (Safari)");
    await expect(status).toContainText("Thêm vào Màn hình chính");
    await expect(status).toContainText("Chia sẻ");
    await expect(page.getByRole("button", { name: "Cài ứng dụng" })).toHaveCount(0);
  });
});

test("đang chạy dạng ứng dụng (standalone)", async ({ page }) => {
  await page.addInitScript(() => {
    const orig = window.matchMedia.bind(window);
    window.matchMedia = (q: string) => {
      if (q.includes("display-mode")) {
        return { ...orig(q), matches: q.includes("standalone"), media: q } as MediaQueryList;
      }
      return orig(q);
    };
  });
  await openInstall(page);
  await expect(page.getByText("Bạn đang dùng Nihongo dạng ứng dụng.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cài ứng dụng" })).toHaveCount(0);
});

test("trình duyệt không hỗ trợ cài: giải thích ngắn", async ({ page }) => {
  await openInstall(page);
  await expect(page.getByRole("status")).toContainText("chưa hỗ trợ cài trực tiếp");
});

for (const [name, size] of [
  ["1280px", { width: 1280, height: 800 }],
  ["375px", { width: 375, height: 812 }],
] as const) {
  test(`axe 0 vi phạm, không tràn ngang ở ${name}`, async ({ page }) => {
    await page.setViewportSize(size);
    await openInstall(page);
    await page.getByText("Chrome trên Android").click(); // mở một mục details để kiểm cả nội dung
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(r.violations).toEqual([]);
  });
}
