import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { studyDate } from "../../src/lib/domain/study-day";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

function dayOffset(n: number) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return studyDate(new Date(Date.now() + n * 86_400_000), tz);
}

// 12 ngày học trong 35 ngày gần nhất, tính cả hôm nay (tăng dần như RPC).
const studied = [0, 1, 2, 3, 4, 5, 8, 9, 13, 20, 27, 34].map((n) => dayOffset(-n)).reverse();

const base = {
  due_count: 24,
  new_done_today: 6,
  new_per_day: 10,
  review_limit: 100,
  streak: 6,
  total_days: 19,
  xp_total: 1234,
  xp_today: 33,
  median_seconds_7d: null,
  exam_date: null as string | null,
  studied_today: true,
  level: "N4",
  // Ngày ngoài cửa sổ (nếu lỡ có) không được vẽ.
  study_days_35: [dayOffset(-40), ...studied],
};

async function open(page: Page, dash: object | "fail") {
  await mockLoggedInBackend(page);
  await page.route("**/rest/v1/rpc/get_dashboard", (route) =>
    dash === "fail" ? route.abort("failed") : route.fulfill({ json: dash }),
  );
  await loginViaForm(page);
}
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const days = (page: Page) => page.getByRole("region", { name: "Ngày học" });
const grid = (page: Page) => days(page).getByRole("img");
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("trang chính", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("hero: thẻ đến hạn, thẻ mới, tiến độ, Bắt đầu ôn", async ({ page }) => {
    await open(page, base);
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Hôm nay: 28 thẻ, khoảng 10 phút");
    const hero = page.getByRole("region", { name: "Ôn hôm nay" });
    await expect(hero).toContainText("24");
    await expect(hero).toContainText("thẻ đến hạn");
    await expect(hero).toContainText("+ 4 thẻ mới");
    const bar = hero.getByRole("progressbar", { name: "Thẻ mới hôm nay" });
    await expect(bar).toHaveAttribute("aria-valuenow", "6");
    await expect(bar).toHaveAttribute("aria-valuemax", "10");
    await expect(hero.getByText("6 / 10 thẻ mới")).toBeVisible();
    await expect(page.getByRole("link", { name: "Bắt đầu ôn" })).toHaveAttribute("href", "/on-tap");
  });

  test("dải ngày học: 35 ô, đúng số dấu triện, nhãn tổng, từng ô ẩn với trình đọc", async ({ page }) => {
    await open(page, base);
    await expect(days(page)).toContainText("19");
    await expect(days(page)).toContainText("ngày đã học");
    await expect(days(page)).toContainText("Chuỗi 6 ngày");
    await expect(grid(page)).toHaveAccessibleName("Đã học 12 trong 35 ngày gần nhất, hôm nay đã học");
    await expect(grid(page).locator(":scope > span")).toHaveCount(35);
    await expect(grid(page).locator(":scope > span[aria-hidden='true']")).toHaveCount(35);
    await expect(grid(page).locator(".dash-seal")).toHaveCount(12);
    await expect(grid(page).locator(".dash-cell-today")).toHaveCount(0);
  });

  test("hôm nay chưa học: ô cuối viền đứt, nhãn nói chưa học", async ({ page }) => {
    await open(page, { ...base, studied_today: false, study_days_35: studied.slice(0, -1) });
    await expect(grid(page)).toHaveAccessibleName("Đã học 11 trong 35 ngày gần nhất, hôm nay chưa học");
    await expect(grid(page).locator(":scope > span").last()).toHaveClass(/dash-cell-today/);
    await expect(grid(page).locator(".dash-seal")).toHaveCount(11);
  });

  test("RPC cũ không có study_days_35: ẩn lưới, trang vẫn đủ", async ({ page }) => {
    const old: Record<string, unknown> = { ...base };
    delete old.study_days_35;
    delete old.level;
    await open(page, old);
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Hôm nay: 28 thẻ, khoảng 10 phút");
    await expect(days(page)).toContainText("19");
    await expect(grid(page)).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Điểm XP" })).toContainText("1.234");
    await expect(page.getByRole("link", { name: "Đặt ngày thi để đếm ngược" })).toBeVisible();
  });

  test("dùng trung vị khi có; giới hạn ôn mỗi ngày chặn thẻ đến hạn", async ({ page }) => {
    await open(page, { ...base, due_count: 250, review_limit: 100, median_seconds_7d: 30, new_done_today: 10 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Hôm nay: 100 thẻ, khoảng 50 phút");
    await expect(page.getByRole("region", { name: "Ôn hôm nay" })).toContainText("+ 0 thẻ mới");
  });

  test("chuỗi 0 dùng câu trung tính", async ({ page }) => {
    await open(page, { ...base, streak: 0, total_days: 0, studied_today: false, study_days_35: [] });
    await expect(page.getByText("Bắt đầu chuỗi mới hôm nay")).toBeVisible();
    await expect(grid(page)).toHaveAccessibleName("Đã học 0 trong 35 ngày gần nhất, hôm nay chưa học");
  });

  test("Điểm XP và lối vào trắc nghiệm", async ({ page }) => {
    await open(page, base);
    const xp = page.getByRole("region", { name: "Điểm XP" });
    await expect(xp).toContainText("1.234");
    await expect(xp).toContainText("hôm nay +33");
    await expect(page.getByRole("link", { name: "Trắc nghiệm · 10 câu" })).toHaveAttribute("href", "/trac-nghiem");
  });

  test("chưa đặt ngày thi: ô gợi ý dẫn tới Cài đặt", async ({ page }) => {
    await open(page, base);
    await expect(page.getByRole("link", { name: "Đặt ngày thi để đếm ngược" })).toHaveAttribute("href", "/cai-dat");
    await expect(page.getByRole("region", { name: /Thi JLPT/ })).toHaveCount(0);
  });

  test("ngày thi: Thi JLPT N4 còn 30 ngày", async ({ page }) => {
    await open(page, { ...base, exam_date: dayOffset(30) });
    const exam = page.getByRole("region", { name: "Thi JLPT N4 còn" });
    await expect(exam).toContainText("30");
    await expect(exam).toContainText("ngày");
  });

  test("ngày thi: hôm nay thi", async ({ page }) => {
    await open(page, { ...base, exam_date: dayOffset(0) });
    await expect(page.getByRole("region", { name: "Thi JLPT N4" })).toContainText("Hôm nay thi");
  });

  test("ngày thi: quá hạn mời đặt lại, liên kết tới cài đặt", async ({ page }) => {
    await open(page, { ...base, exam_date: dayOffset(-10) });
    const link = page.getByRole("region", { name: "Thi JLPT N4" }).getByRole("link");
    await expect(link).toHaveAttribute("href", "/cai-dat");
  });

  test("hết thẻ: Hôm nay đã xong, dấu triện lớn, không còn Bắt đầu ôn", async ({ page }) => {
    await open(page, { ...base, due_count: 0, new_done_today: 10 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Hôm nay đã xong");
    const hero = page.getByRole("region", { name: "Ôn hôm nay" });
    await expect(hero).toContainText("Xong rồi. Hẹn mai.");
    await expect(hero.locator(".dash-seal-big")).toBeVisible();
    await expect(page.getByRole("link", { name: "Bắt đầu ôn" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Ôn thêm kana" })).toHaveAttribute("href", "/kana");
    await expect(page.getByRole("link", { name: "Trắc nghiệm · 10 câu" })).toBeVisible();
  });

  test("dấu triện hôm nay đóng một lần mỗi ngày", async ({ page }) => {
    await open(page, base);
    await expect(grid(page).locator("[data-fresh]")).toHaveCount(1);
    await page.reload();
    await expect(grid(page)).toBeVisible();
    await expect(grid(page).locator("[data-fresh]")).toHaveCount(0);
  });

  test("RPC lỗi: thông báo trung tính, Thử lại, Bắt đầu ôn vẫn bấm được", async ({ page }) => {
    await open(page, "fail");
    await expect(page.getByRole("alert").filter({ hasText: "Chưa tải được số liệu" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Bắt đầu ôn" })).toBeEnabled();
    // Thử lại thành công sau khi mạng lại có.
    await page.unroute("**/rest/v1/rpc/get_dashboard");
    await page.route("**/rest/v1/rpc/get_dashboard", (route) => route.fulfill({ json: base }));
    await page.getByRole("button", { name: "Thử lại" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Hôm nay: 28 thẻ, khoảng 10 phút");
  });

  test("tải lại khi tab hiện lại (US-10)", async ({ page }) => {
    await open(page, base);
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Hôm nay: 28 thẻ, khoảng 10 phút");
    await page.unroute("**/rest/v1/rpc/get_dashboard");
    await page.route("**/rest/v1/rpc/get_dashboard", (route) =>
      route.fulfill({ json: { ...base, due_count: 20, new_done_today: 10 } }),
    );
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Hôm nay: 20 thẻ, khoảng 7 phút");
  });

  const states = [
    ["thường", { ...base, exam_date: dayOffset(30) }],
    ["đã xong", { ...base, due_count: 0, new_done_today: 10 }],
  ] as const;

  for (const [name, dash] of states) {
    test(`axe 0 vi phạm A/AA ở 1280px (${name})`, async ({ page }) => {
      await open(page, dash);
      await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(/Hôm nay/);
      await page.waitForTimeout(1400); // chờ hiện dần/đóng dấu xong để đo tương phản đúng
      const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(r.violations).toEqual([]);
    });
  }

  for (const width of [1280, 1440]) {
    test(`không tràn ngang ở ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, { ...base, exam_date: dayOffset(30) });
      await expect(grid(page)).toBeVisible();
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("trang chính (điện thoại 375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const states = [
    ["thường", { ...base, exam_date: dayOffset(30) }],
    ["đã xong", { ...base, due_count: 0, new_done_today: 10 }],
  ] as const;

  for (const [name, dash] of states) {
    test(`không tràn ngang; axe 0 vi phạm (${name})`, async ({ page }) => {
      await open(page, dash);
      await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(/Hôm nay/);
      await expect(grid(page)).toBeVisible();
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      await page.waitForTimeout(1400); // chờ hiện dần xong để đo tương phản đúng
      const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(r.violations).toEqual([]);
    });
  }
});
