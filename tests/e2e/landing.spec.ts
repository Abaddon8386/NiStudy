import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const credits = JSON.parse(readFileSync("public/media/credits.json", "utf8")) as { caption: string; license: string }[];

const SECTION_HEADINGS = [
  "Đủ các mảng, một chỗ học.",
  "Âm Hán Việt là lối tắt.",
  "Một ngày học, bốn nhịp.",
  "Đã có hôm nay, và đang làm tiếp.",
  "Chữ đầu tiên học hôm nay?",
];

/** Cuộn hết trang để mọi khối hiện dần và câu tuyên ngôn sáng đủ, rồi về đầu. */
async function scrollThrough(page: Page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = await page.evaluate(() => Math.round(innerHeight * 0.7));
  for (let y = 0; y <= h; y += step) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(1300); // chờ hiện dần xong để axe đo tương phản đúng
}

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("điều hướng", () => {
  test("chưa đăng nhập mở / thì tới /gioi-thieu", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/gioi-thieu$/);
    await expect(page.getByRole("heading", { level: 1, name: "Học tiếng Nhật trọn vẹn." })).toBeVisible();
  });

  test("CTA chính dẫn tới /dang-ky; có nút Đăng nhập", async ({ page }) => {
    await page.goto("/gioi-thieu");
    const main = page.locator("main");
    const cta = main.getByRole("link", { name: "Bắt đầu học miễn phí" }).first();
    await expect(cta).toHaveAttribute("href", "/dang-ky");
    await expect(main.getByRole("link", { name: "Đăng nhập" }).first()).toHaveAttribute("href", "/dang-nhap");
    await cta.click();
    await expect(page).toHaveURL(/\/dang-ky$/);
  });

  test("đã đăng nhập vẫn xem được, nút đổi thành Vào học", async ({ page }) => {
    await mockLoggedInBackend(page);
    await page.route("**/rest/v1/rpc/**", (r) => r.fulfill({ json: {} }));
    await loginViaForm(page);
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/gioi-thieu");
    await expect(page).toHaveURL(/\/gioi-thieu$/);
    const go = page.locator("main").getByRole("link", { name: "Vào học" }).first();
    await expect(go).toHaveAttribute("href", "/");
    await expect(page.locator("main").getByRole("link", { name: "Bắt đầu học miễn phí" })).toHaveCount(0);
  });

  test("màn đăng nhập và đăng ký có liên kết Tìm hiểu Nihongo", async ({ page }) => {
    for (const path of ["/dang-nhap", "/dang-ky"]) {
      await page.goto(path);
      await expect(page.getByRole("link", { name: "Tìm hiểu Nihongo" })).toHaveAttribute("href", "/gioi-thieu");
    }
  });
});

test.describe("nội dung và cấu trúc", () => {
  test("đúng một main, một h1, đủ tiêu đề các phần; chữ Nhật có lang=ja", async ({ page }) => {
    await page.goto("/gioi-thieu");
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    for (const name of SECTION_HEADINGS) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeAttached();
    }
    await expect(page.getByText("Sắp có", { exact: true }).first()).toBeAttached();
    // Mọi chữ kanji/kana hiển thị nằm trong phần tử có lang="ja" (trừ bản sr-only của câu tuyên ngôn).
    const bare = await page.evaluate(() => {
      const re = /[぀-ヿ一-鿿]/;
      const out: string[] = [];
      const walker = document.createTreeWalker(document.querySelector("main")!, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement!;
        if (!re.test(n.textContent ?? "") || el.closest("[lang='ja']") || el.closest(".sr-only, [aria-hidden='true']")) continue;
        out.push((n.textContent ?? "").trim());
      }
      return out;
    });
    expect(bare).toEqual([]);
  });

  test("ảnh có alt đúng nghĩa; ảnh trang trí alt rỗng; clip không tự tải trước", async ({ page }) => {
    await page.goto("/gioi-thieu");
    // Ảnh trong chuỗi cảnh (.ss) là trang trí, alt rỗng; chú thích là văn bản thật.
    const deco = await page.locator("main .ss img").evaluateAll((els) => els.map((e) => e.getAttribute("alt")));
    expect(deco.length).toBeGreaterThanOrEqual(1);
    expect(deco.every((a) => a === "")).toBe(true);
    await expect(page.locator("main .ss figcaption").first()).toContainText("Ōmorimachi");
    const imgs = await page.locator("main img:not(.ss img)").evaluateAll((els) =>
      els.map((e) => ({ alt: e.getAttribute("alt"), src: e.getAttribute("src") ?? "" })),
    );
    expect(imgs.length).toBeGreaterThanOrEqual(6);
    for (const i of imgs) {
      expect(i.alt, i.src).not.toBeNull();
      expect((i.alt ?? "").length, i.src).toBeGreaterThan(10);
    }
    const video = page.locator("main .lp-fig video");
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).toHaveAttribute("poster", /\/media\/.+\.webp$/);
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
  });

  test("/nguon-du-lieu có mục Hình ảnh và video khớp credits.json", async ({ page }) => {
    await page.goto("/nguon-du-lieu");
    const section = page.locator("section", { has: page.getByRole("heading", { name: "Hình ảnh và video" }) });
    await expect(section).toHaveCount(1);
    await expect(section.locator("li")).toHaveCount(credits.length);
    for (const c of credits) {
      const item = section.locator("li").filter({ hasText: c.caption });
      await expect(item).toHaveCount(1);
      await expect(item).toContainText(`Giấy phép: ${c.license}`);
    }
  });
});

test.describe("thứ sống: tra âm Hán Việt", () => {
  test("dùng được hoàn toàn bằng bàn phím", async ({ page }) => {
    await page.goto("/gioi-thieu");
    const input = page.getByLabel("Gõ một từ Hán Việt bạn biết");
    await input.focus();
    await page.keyboard.press("Control+A");
    await page.keyboard.type("thoi gian");
    const hits = page.locator(".lp-lookup-hits li");
    await expect(hits.first()).toContainText("時間");
    await expect(hits.first()).toContainText("THỜI GIAN");
    await expect(page.getByRole("status").filter({ hasText: "khớp" })).toContainText("thoi gian");

    // Tab sang gợi ý đầu tiên rồi Enter.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "học sinh" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("học sinh");
    await expect(page.getByRole("button", { name: "học sinh" })).toHaveAttribute("aria-pressed", "true");
    await expect(hits.first()).toContainText("学生");

    await input.fill("zzz");
    await expect(hits).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "Chưa có" })).toBeVisible();
  });
});

test.describe("chuyển động", () => {
  test("reduced-motion: không video tự chạy, không dải chữ chạy, nội dung hiện đủ, cảnh không ghim", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/gioi-thieu");
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => {
      const v = document.querySelector("main video") as HTMLVideoElement;
      return {
        videoPaused: v.paused,
        videoSrc: v.currentSrc,
        sources: v.querySelectorAll("source").length,
        marquee: getComputedStyle(document.querySelector(".lp-marquee-track")!).animationName,
        live: document.querySelectorAll("[data-live]").length,
        lenis: document.documentElement.classList.contains("lenis"),
        hidden: [...document.querySelectorAll("[data-motion], .lp-step, .lp-step-text p")].filter(
          (e) => Number(getComputedStyle(e).opacity) < 1,
        ).length,
      };
    });
    expect(state).toEqual({ videoPaused: true, videoSrc: "", sources: 0, marquee: "none", live: 0, lenis: false, hidden: 0 });
    await expect(page.getByRole("button", { name: "Dừng video" })).toHaveCount(0);
    await ctx.close();
  });

  test("tắt JS: nội dung hiện đủ, không kẹt ẩn", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/gioi-thieu");
    await expect(page.locator("html")).not.toHaveClass(/motion-ready/);
    await expect(page.locator("h1")).toBeVisible();
    for (const name of SECTION_HEADINGS) {
      const h = page.getByRole("heading", { level: 2, name });
      await h.scrollIntoViewIfNeeded();
      await expect(h).toBeVisible();
    }
    // Kết quả mặc định của ô tra cứu có sẵn trong HTML.
    await expect(page.locator(".lp-lookup-hits li").first()).toContainText("学");
    // Bốn bước "một ngày học" đều đọc được.
    for (const verb of ["Mở", "Lật", "Chấm", "Đóng dấu"]) {
      await expect(page.getByRole("heading", { level: 3, name: verb, exact: true })).toBeVisible();
    }
    const opacities = await page
      .locator("[data-motion], .lp-step-text p, .lp-read [aria-hidden] > span")
      .evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
    expect(opacities.every((o) => o === 1)).toBe(true);
    await ctx.close();
  });

  test("chế độ thường: cảnh ghim chạy theo cuộn (bước đổi, cuộn phim hero đổi tiến độ)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/gioi-thieu");
    await expect(page.locator(".lp-hero")).toHaveAttribute("data-live", "");
    await expect(page.locator(".lp-story")).toHaveAttribute("data-live", "");
    const track = await page.evaluate(() => {
      const r = document.querySelector("[data-story-track]")!.getBoundingClientRect();
      return { top: r.top + scrollY, h: r.height };
    });
    await page.evaluate((y) => scrollTo(0, y), track.top + (track.h - 800) * 0.6);
    await expect(page.locator(".lp-story")).toHaveAttribute("data-step", "2");
    await page.evaluate(() => scrollTo(0, 600));
    await expect
      .poll(() => page.evaluate(() => Number(getComputedStyle(document.querySelector(".lp-hero")!).getPropertyValue("--p"))))
      .toBeGreaterThan(0.2);
  });
});

for (const [label, viewport] of [
  ["375", { width: 375, height: 812 }],
  ["1280", { width: 1280, height: 800 }],
  ["1440", { width: 1440, height: 900 }],
] as const) {
  test(`${label}px: không tràn ngang${label === "1440" ? "" : ", axe A/AA sạch"}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/gioi-thieu");
    await expect(page.locator("h1")).toBeVisible();
    await scrollThrough(page);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    if (label !== "1440") {
      const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
    }
  });
}

test("hiệu năng sơ bộ: LCP và dung lượng tải lần đầu", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/gioi-thieu", { waitUntil: "networkidle" });
  const perf = await page.evaluate(
    () =>
      new Promise<{ lcp: number; bytes: number; video: boolean }>((resolve) => {
        let lcp = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) lcp = Math.max(lcp, e.startTime);
        }).observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => {
          const res = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
          const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
          const bytes = res.reduce((s, r) => s + (r.transferSize || 0), nav?.transferSize || 0);
          resolve({ lcp, bytes, video: res.some((r) => r.name.includes(".mp4")) });
        }, 500);
      }),
  );
  test.info().annotations.push({ type: "perf", description: `LCP ${Math.round(perf.lcp)}ms, tải ${Math.round(perf.bytes / 1024)} KB` });
  expect(perf.video).toBe(false); // clip chỉ tải khi gần khung nhìn
  expect(perf.lcp).toBeLessThan(2500);
  expect(perf.bytes).toBeLessThan(1_500_000);
});

test.describe("màn auth: nền cảnh toàn trang", () => {
  const coversViewport = (page: Page) =>
    page.locator(".bd").evaluate((e) => {
      const r = e.getBoundingClientRect();
      return { pos: getComputedStyle(e).position, x: r.x, y: r.y, w: r.width - innerWidth, h: r.height - innerHeight };
    });

  test("1280px: nền phủ kín, tranh vẽ hiện trước, clip chỉ nạp khi gần lượt; nút tạm dừng dừng clip và cánh hoa", async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dang-nhap");
    const bd = page.locator(".bd");
    await expect(bd).toHaveAttribute("data-live", "");
    expect(await coversViewport(page)).toEqual({ pos: "fixed", x: 0, y: 0, w: 0, h: 0 });
    await expect(bd.locator(".bd-layer")).toHaveCount(4);
    await expect(bd.locator(".bd-layer").first()).toHaveAttribute("data-active", "");
    await expect(page.locator(".bd-caption")).toContainText("Minh họa");
    await expect(page.locator(".bd-caption")).toContainText("Núi Phú Sĩ");
    // Lúc mở trang: clip chưa có nguồn, chưa có poster.
    const vids = bd.locator("video");
    await expect(vids).toHaveCount(3);
    for (const v of await vids.all()) await expect(v).toHaveAttribute("preload", "none");
    await expect(bd.locator("video source")).toHaveCount(0);
    expect(await vids.first().evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
    await expect(bd.locator("canvas.bd-petals")).toHaveAttribute("data-running", "");
    // ~3 giây sau: clip của cảnh kế tiếp được gắn nguồn (WebM + MP4) và poster.
    await expect(vids.first().locator("source")).toHaveCount(2, { timeout: 6000 });
    await expect(vids.first()).toHaveAttribute("poster", /\/media\/.+\.webp$/);
    await expect(vids.nth(1).locator("source")).toHaveCount(0);
    // Đến lượt clip đầu: clip phát.
    await expect(bd.locator(".bd-layer").nth(1)).toHaveAttribute("data-active", "", { timeout: 12_000 });
    await expect(page.locator(".bd-caption")).toContainText("Fujisan");
    await expect.poll(() => vids.first().evaluate((v: HTMLVideoElement) => !v.paused), { timeout: 5000 }).toBe(true);

    const pause = page.getByRole("button", { name: "Tạm dừng nền chuyển động" });
    await expect(pause).toHaveAttribute("aria-pressed", "false");
    expect((await pause.boundingBox())!.width).toBeGreaterThanOrEqual(44);
    await expect(pause).not.toContainText("Dừng");
    await pause.click();
    const play = page.getByRole("button", { name: "Phát nền chuyển động" });
    await expect(play).toHaveAttribute("aria-pressed", "true");
    await expect(bd).toHaveAttribute("data-paused", "");
    expect(await vids.first().evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    await expect(bd.locator("canvas.bd-petals")).not.toHaveAttribute("data-running", "");
    expect(await page.locator(".bd-cloud-mid").evaluate((e) => getComputedStyle(e).animationPlayState)).toBe("paused");
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  test("1280px: tạm dừng cũng dừng cánh hoa và mây ở cảnh vẽ", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dang-ky");
    await expect(page.locator(".bd")).toHaveAttribute("data-live", "");
    await page.getByRole("button", { name: "Tạm dừng nền chuyển động" }).click();
    await expect(page.locator("canvas.bd-petals")).not.toHaveAttribute("data-running", "");
    expect(await page.locator(".bd-cloud-far").evaluate((e) => getComputedStyle(e).animationPlayState)).toBe("paused");
    await page.getByRole("button", { name: "Phát nền chuyển động" }).click();
    await expect(page.locator("canvas.bd-petals")).toHaveAttribute("data-running", "");
  });

  test("375px: nền phủ kín, chỉ tranh vẽ (không clip, không tải mp4/webm), thẻ form gần full ngang", async ({ page }) => {
    const media: string[] = [];
    page.on("request", (r) => {
      if (/\.(mp4|webm)(\?|$)/.test(r.url())) media.push(r.url());
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dang-ky");
    await expect(page.locator(".bd")).toHaveAttribute("data-live", "");
    expect(await coversViewport(page)).toEqual({ pos: "fixed", x: 0, y: 0, w: 0, h: 0 });
    await expect(page.locator(".bd video")).toHaveCount(0);
    await expect(page.locator(".bd .bd-layer")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Tạm dừng nền chuyển động" })).toBeVisible();
    const card = (await page.locator(".auth-card").boundingBox())!;
    expect(card.width).toBeGreaterThanOrEqual(355);
    expect(card.y).toBeGreaterThan(250); // nửa trên để lộ cảnh
    await expect(page.getByRole("heading", { level: 1, name: "Đăng ký" })).toBeVisible();
    await page.waitForTimeout(1500);
    expect(media).toEqual([]);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  for (const [w, h] of [
    [1280, 800],
    [1440, 900],
  ] as const) {
    test(`${w}px: thẻ form lệch phải, không tràn ngang ở /dang-nhap và /dang-ky`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      for (const path of ["/dang-nhap", "/dang-ky"]) {
        await page.goto(path);
        const card = (await page.locator(".auth-card").boundingBox())!;
        expect(card.width).toBeLessThanOrEqual(440);
        expect(card.x).toBeGreaterThan(w / 2);
        expect(await overflow(page)).toBeLessThanOrEqual(0);
      }
    });
  }

  test("reduced-motion: tranh tĩnh, không clip, không canvas, không crossfade, không nút", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/dang-nhap");
    await expect(page.getByRole("heading", { level: 1, name: "Đăng nhập" })).toBeVisible();
    await page.waitForTimeout(800);
    const bd = page.locator(".bd");
    await expect(bd).not.toHaveAttribute("data-live", "");
    await expect(bd.locator(".bd-layer")).toHaveCount(1);
    await expect(bd.locator("svg.bd-art-svg")).toHaveCount(1);
    await expect(bd.locator("video")).toHaveCount(0);
    await expect(bd.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /nền chuyển động/ })).toHaveCount(0);
    expect(await page.locator(".bd-cloud-mid").evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
    await ctx.close();
  });

  test("tắt JS: tranh có sẵn trong HTML, tiêu đề và chú thích đọc được", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/dang-nhap");
    await expect(page.getByRole("heading", { level: 1, name: "Đăng nhập" })).toBeVisible();
    await expect(page.locator(".bd svg.bd-art-svg")).toBeVisible();
    await expect(page.locator(".bd video, .bd canvas")).toHaveCount(0);
    await expect(page.locator(".bd-caption")).toContainText("Núi Phú Sĩ");
    // Form đăng nhập nằm trong Suspense (đọc tham số URL) nên cần JS, như trước thay đổi này.
    await ctx.close();
  });
});
