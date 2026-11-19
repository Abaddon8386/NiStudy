import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { studyDate } from "../../src/lib/domain/study-day";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

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
  exam_date: null,
  studied_today: true,
};

function dayOffset(n: number) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return studyDate(new Date(Date.now() + n * 86_400_000), tz);
}

async function open(page: Page, dash: object | "fail") {
  await mockLoggedInBackend(page);
  await page.route("**/rest/v1/rpc/get_dashboard", (route) =>
    dash === "fail" ? route.abort("failed") : route.fulfill({ json: dash }),
  );
  await loginViaForm(page);
}
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("trang chính", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("hiện số thẻ, phút ước tính, tiến độ, ngày học, chuỗi, XP", async ({ page }) => {
    await open(page, base);
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Hôm nay: 28 thẻ, khoảng 10 phút");
    await expect(page.getByText("24 thẻ đến hạn · 4 thẻ mới · khoảng 10 phút")).toBeVisible();
    const bar = page.getByRole("progressbar", { name: "Thẻ mới hôm nay" });
    await expect(bar).toHaveAttribute("aria-valuenow", "6");
    await expect(bar).toHaveAttribute("aria-valuemax", "10");
    await expect(page.getByText("6 / 10")).toBeVisible();
    await expect(page.getByRole("region", { name: "Ngày học" })).toContainText("19");
    await expect(page.getByRole("region", { name: "Ngày học" })).toContainText("Chuỗi 6 ngày");
    await expect(page.getByRole("region", { name: "XP" })).toContainText("1.234");
    await expect(page.getByRole("region", { name: "XP" })).toContainText("hôm nay +33");
    await expect(page.getByRole("link", { name: "Bắt đầu ôn" })).toHaveAttribute("href", "/on-tap");
    // Không đặt ngày thi: không có khối.
    await expect(page.getByRole("region", { name: "Ngày thi" })).toHaveCount(0);
  });

  test("dùng trung vị khi có; giới hạn ôn mỗi ngày chặn thẻ đến hạn", async ({ page }) => {
    await open(page, { ...base, due_count: 250, review_limit: 100, median_seconds_7d: 30, new_done_today: 10 });
    await expect(page.getByText("100 thẻ đến hạn · 0 thẻ mới · khoảng 50 phút")).toBeVisible();
  });

  test("chuỗi 0 dùng câu trung tính", async ({ page }) => {
    await open(page, { ...base, streak: 0, total_days: 0 });
    await expect(page.getByText("Bắt đầu chuỗi mới hôm nay")).toBeVisible();
  });

  test("ngày thi: còn 30 ngày", async ({ page }) => {
    await open(page, { ...base, exam_date: dayOffset(30) });
    await expect(page.getByRole("region", { name: "Ngày thi" })).toContainText("Còn 30 ngày");
  });

  test("ngày thi: hôm nay thi", async ({ page }) => {
    await open(page, { ...base, exam_date: dayOffset(0) });
    await expect(page.getByRole("region", { name: "Ngày thi" })).toContainText("Hôm nay thi");
  });

  test("ngày thi: quá hạn mời đặt lại, liên kết tới cài đặt", async ({ page }) => {
    await open(page, { ...base, exam_date: dayOffset(-10) });
    const link = page.getByRole("region", { name: "Ngày thi" }).getByRole("link");
    await expect(link).toHaveAttribute("href", "/cai-dat");
  });

  test("hết thẻ: Hôm nay đã xong, không còn Bắt đầu ôn", async ({ page }) => {
    await open(page, { ...base, due_count: 0, new_done_today: 10 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Hôm nay đã xong");
    await expect(page.getByRole("link", { name: "Bắt đầu ôn" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Xem bảng kana" })).toBeVisible();
  });

  test("RPC lỗi: thông báo trung tính, Thử lại, Bắt đầu ôn vẫn bấm được", async ({ page }) => {
    await open(page, "fail");
    await expect(page.getByText("Chưa tải được số liệu")).toBeVisible();
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

  test("axe 0 vi phạm A/AA ở 1280px", async ({ page }) => {
    await open(page, { ...base, exam_date: dayOffset(30) });
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(/Hôm nay: 28/);
    await page.waitForTimeout(1300); // chờ hiện dần xong để đo tương phản đúng
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(r.violations).toEqual([]);
  });
});

test.describe("trang chính (điện thoại 375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("không tràn ngang; axe 0 vi phạm", async ({ page }) => {
    await open(page, { ...base, exam_date: dayOffset(30) });
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(/Hôm nay: 28/);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await page.waitForTimeout(1300); // chờ hiện dần xong để đo tương phản đúng
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(r.violations).toEqual([]);
  });
});
