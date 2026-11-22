import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

const sample = JSON.parse(readFileSync("tests/fixtures/queue-sample.json", "utf8")) as {
  due: { card: { id: string; kind: string } }[];
  new_candidates: { card: { kind: string }; details?: object }[];
};
// Giống learning.spec: hết giai đoạn hiragana cơ bản để có thẻ mới không chỉ là kana.
const queue3 = {
  ...sample,
  new_candidates: sample.new_candidates
    .filter((c) => c.card.kind !== "vocab")
    .map((c) => (c.card.kind === "kana" ? { ...c, details: { ...c.details, grp: "dakuten" } } : c)),
};
const dash = {
  due_count: 24, new_done_today: 6, new_per_day: 10, review_limit: 100, streak: 6, total_days: 19,
  xp_total: 1234, xp_today: 33, median_seconds_7d: null, exam_date: null, studied_today: true,
};
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function openHome(page: Page) {
  await mockLoggedInBackend(page);
  await page.route("**/rest/v1/rpc/get_dashboard", (r) => r.fulfill({ json: dash }));
  await page.route("**/rest/v1/rpc/get_today_queue", (r) => r.fulfill({ json: queue3 }));
  await loginViaForm(page);
  await expect(page.getByRole("link", { name: "Bắt đầu ôn" })).toBeVisible();
}
const axe = async (page: Page) => {
  await page.waitForTimeout(1300); // chờ hiện dần/đếm số xong để đo tương phản đúng
  const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
};
const motionState = (page: Page) =>
  page.$$eval("[data-motion]", (els) =>
    els.map((e) => ({ opacity: getComputedStyle(e).opacity, transform: getComputedStyle(e).transform, isIn: e.classList.contains("is-in") })),
  );

test.describe("chuyển động (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("reduced-motion: mọi khối hiện ngay, số hiện giá trị cuối", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openHome(page);
    const states = await motionState(page); // ngay sau khi tải, không chờ
    expect(states.length).toBeGreaterThanOrEqual(3);
    for (const s of states) expect(s).toMatchObject({ opacity: "1", transform: "none" });
    // Số đếm không chạy: phần nhìn thấy là giá trị cuối ngay.
    await expect(page.getByRole("region", { name: "XP" }).locator('[aria-hidden="true"]').first()).toHaveText("1.234");
    // Focus ring vẫn hiện.
    await page.getByRole("link", { name: "Bắt đầu ôn" }).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const outline = await page.getByRole("link", { name: "Bắt đầu ôn" }).evaluate((e) => getComputedStyle(e).outlineStyle);
    expect(outline).toBe("solid");
  });

  test("chế độ thường: khối có lớp is-in, opacity 1; số đếm tới giá trị cuối", async ({ page }) => {
    await openHome(page);
    await expect(page.locator("html")).toHaveClass(/motion-ready/);
    await expect.poll(async () => (await motionState(page)).every((s) => s.isIn && s.opacity === "1"), { timeout: 5000 }).toBe(true);
    await expect(page.getByRole("region", { name: "XP" }).locator('[aria-hidden="true"]').first()).toHaveText("1.234");
    await expect(page.getByRole("region", { name: "Ngày học" }).locator('[aria-hidden="true"]').first()).toHaveText("19");
  });

  test("phiên ôn: từ phím 3 tới khi thẻ kế xuất hiện ≤ 200ms (trung vị 5 lượt)", async ({ page }) => {
    // 7 thẻ đến hạn để chấm liền 5 lượt mà phiên chưa kết thúc.
    const many = {
      ...queue3,
      new_candidates: [],
      due: Array.from({ length: 7 }, (_, i) => ({
        ...sample.due[0],
        card: { ...sample.due[0].card, id: `vocab:${i + 1}` },
      })),
    };
    await mockLoggedInBackend(page);
    await page.route("**/rest/v1/rpc/get_dashboard", (r) => r.fulfill({ json: dash }));
    await page.route("**/rest/v1/rpc/get_today_queue", (r) => r.fulfill({ json: many }));
    await loginViaForm(page);
    await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
    await expect(page.getByRole("button", { name: /Lật thẻ/ })).toBeVisible();

    // Đo ngay trong trang bằng performance.now(): từ lúc phát keydown tới khi DOM (số thẻ trên header) đổi.
    // Cách này chỉ đo thời gian xử lý của ứng dụng, không gồm độ trễ vòng lặp Playwright/CDP khi máy bận
    // (nguyên nhân ca cũ chập chờn khi chạy cả bộ). Lấy trung vị 5 lượt để một lượt nghẽn không làm đỏ.
    const times = await page.evaluate(async () => {
      const counter = document.querySelector("header p[aria-live]") as HTMLElement;
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const until = (cond: () => boolean) =>
        new Promise<void>((resolve) => {
          const tick = () => (cond() ? resolve() : requestAnimationFrame(tick));
          tick();
        });
      const key = (k: string) => document.body.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
      const out: number[] = [];
      for (let i = 0; i < 5; i++) {
        const before = counter.textContent;
        key(" ");
        await until(() => !!document.querySelector('button[aria-keyshortcuts="3"]'));
        await sleep(80);
        out.push(
          await new Promise<number>((resolve) => {
            const t0 = performance.now();
            const mo = new MutationObserver(() => {
              if (counter.textContent !== before) {
                mo.disconnect();
                resolve(performance.now() - t0);
              }
            });
            mo.observe(counter, { subtree: true, childList: true, characterData: true });
            key("3");
          }),
        );
        await sleep(80);
      }
      return out;
    });
    expect(times).toHaveLength(5);
    const median = [...times].sort((a, b) => a - b)[2];
    expect(median, `các lượt (ms): ${times.map((t) => t.toFixed(1)).join(", ")}`).toBeLessThanOrEqual(200);
  });

  test("axe 0 vi phạm A/AA trên / và /on-tap", async ({ page }) => {
    await openHome(page);
    await axe(page);
    await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
    await expect(page.getByRole("button", { name: /Lật thẻ/ })).toBeVisible();
    await axe(page);
  });
});

test.describe("chuyển động (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("axe 0 vi phạm A/AA trên / và /on-tap", async ({ page }) => {
    await openHome(page);
    await axe(page);
    await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
    await expect(page.getByRole("button", { name: /Lật thẻ/ })).toBeVisible();
    await axe(page);
  });
});

test.describe("không JS và điều hướng bàn phím", () => {
  test.describe("tắt JS", () => {
    test.use({ javaScriptEnabled: false });
    test("nội dung hiển thị, không kẹt opacity 0", async ({ page }) => {
      await page.goto("/dang-nhap");
      await expect(page.locator("html")).not.toHaveClass(/motion-ready/);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
      expect(await h1.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
      // Mọi khối [data-motion] (nếu có trên trang) cũng phải hiện.
      for (const s of await motionState(page)) expect(s.opacity).toBe("1");
    });
  });

  test("skip link: Tab đầu tiên focus vào skip link, Enter nhảy tới main", async ({ page }) => {
    await page.goto("/dang-nhap");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Bỏ qua tới nội dung chính" });
    await expect(skip).toBeFocused();
    expect((await skip.boundingBox())?.y).toBeGreaterThanOrEqual(0); // đã hiện khi focus
    await page.keyboard.press("Enter");
    await expect(page.locator("main#noi-dung")).toBeFocused();
    await expect(page.locator("main")).toHaveCount(1);
  });
});
