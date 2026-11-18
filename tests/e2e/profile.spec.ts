import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

const NEW_ERR = "Mục tiêu thẻ mới phải từ 5 đến 30.";
const REV_ERR = "Giới hạn ôn phải từ 50 đến 500.";

test.describe("khởi đầu (S-05)", () => {
  test("gửi đúng cột và onboarded_at rồi về trang chính", async ({ page }) => {
    const backend = await mockLoggedInBackend(page, false);
    await loginViaForm(page);
    await expect(page).toHaveURL(/\/khoi-dau$/);

    await page.getByText("N4", { exact: true }).click();
    await page.getByText("Đã biết", { exact: true }).click();
    await page.getByLabel("Thẻ mới mỗi ngày").fill("15");
    await page.getByLabel("Ngày thi (tùy chọn)").fill("2099-12-06");
    await page.getByRole("button", { name: "Bắt đầu học" }).click();

    await expect(page).toHaveURL(/\/$/);
    expect(backend.patches).toHaveLength(1);
    const body = backend.patches[0];
    expect(Object.keys(body).sort()).toEqual(["exam_date", "knows_kana", "level", "new_per_day", "onboarded_at"]);
    expect(body).toMatchObject({ level: "N4", knows_kana: true, new_per_day: 15, exam_date: "2099-12-06" });
    expect(typeof body.onboarded_at).toBe("string");
    await expect(page.getByText("Cấp N4 · 15 thẻ mới mỗi ngày")).toBeVisible();
  });

  test("mặc định N5, chưa biết kana, 10 thẻ; số ngoài khoảng bị chặn", async ({ page }) => {
    const backend = await mockLoggedInBackend(page, false);
    await loginViaForm(page);
    await expect(page.getByRole("radio", { name: "N5" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Chưa biết" })).toBeChecked();
    await expect(page.getByLabel("Thẻ mới mỗi ngày")).toHaveValue("10");
    await page.getByLabel("Thẻ mới mỗi ngày").fill("31");
    await page.getByRole("button", { name: "Bắt đầu học" }).click();
    await expect(page.getByLabel("Thẻ mới mỗi ngày")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("main").getByRole("alert")).toHaveText(NEW_ERR);
    expect(backend.patches).toHaveLength(0);
  });

  test("lỗi mạng: báo lỗi và giữ dữ liệu đã nhập", async ({ page }) => {
    const backend = await mockLoggedInBackend(page, false);
    await loginViaForm(page);
    backend.failPatch = true;
    await page.getByLabel("Thẻ mới mỗi ngày").fill("12");
    await page.getByRole("button", { name: "Bắt đầu học" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Chưa lưu được");
    await expect(page.getByLabel("Thẻ mới mỗi ngày")).toHaveValue("12");
    await expect(page).toHaveURL(/\/khoi-dau$/);
  });

  test("đã khởi đầu thì mở /khoi-dau chuyển về trang chính", async ({ page }) => {
    await mockLoggedInBackend(page, true);
    await loginViaForm(page);
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/khoi-dau");
    await expect(page).toHaveURL(/\/$/);
  });

  test("không có vi phạm axe WCAG A/AA, không tràn ngang ở 375px", async ({ page }) => {
    await mockLoggedInBackend(page, false);
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaForm(page);
    await expect(page.getByRole("button", { name: "Bắt đầu học" })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("cài đặt (S-12)", () => {
  async function openSettings(page: import("@playwright/test").Page, onboarded = true) {
    const backend = await mockLoggedInBackend(page, onboarded);
    await loginViaForm(page);
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("link", { name: "Cài đặt" }).click();
    await expect(page.getByLabel("Thẻ mới mỗi ngày")).toBeVisible();
    return backend;
  }

  test("hiện giá trị mặc định 10 và 100, email và liên kết nguồn dữ liệu", async ({ page }) => {
    await openSettings(page);
    await expect(page.getByLabel("Thẻ mới mỗi ngày")).toHaveValue("10");
    await expect(page.getByLabel("Giới hạn ôn mỗi ngày")).toHaveValue("100");
    await expect(page.getByText("hoc@example.test")).toBeVisible();
    await expect(page.getByRole("link", { name: "Nguồn dữ liệu" })).toHaveAttribute("href", "/nguon-du-lieu");
  });

  test("nhập 3 và 600 hiện lỗi đúng câu, không gửi PATCH", async ({ page }) => {
    const backend = await openSettings(page);
    const goal = page.getByLabel("Thẻ mới mỗi ngày");
    await goal.fill("3");
    await goal.blur();
    await expect(page.getByText(NEW_ERR)).toBeVisible();
    await expect(goal).toHaveAttribute("aria-invalid", "true");
    await expect(goal).toHaveAccessibleDescription(new RegExp(NEW_ERR));

    const limit = page.getByLabel("Giới hạn ôn mỗi ngày");
    await limit.fill("600");
    await expect(page.getByText(REV_ERR)).toBeVisible(); // qua debounce 600ms, chưa blur
    await page.waitForTimeout(300);
    expect(backend.patches).toHaveLength(0);
  });

  test("đổi mục tiêu 8 gửi PATCH new_per_day và hiện Đã lưu", async ({ page }) => {
    const backend = await openSettings(page);
    await page.getByLabel("Thẻ mới mỗi ngày").fill("8");
    await expect(page.getByText("Đã lưu")).toBeVisible();
    expect(backend.patches).toEqual([{ new_per_day: 8 }]);
  });

  test("radio lưu ngay; ngày thi quá khứ bị chặn, đặt rồi xóa được", async ({ page }) => {
    const backend = await openSettings(page);
    await page.getByText("N4", { exact: true }).click();
    await expect(page.getByText("Đã lưu")).toBeVisible();
    expect(backend.patches).toEqual([{ level: "N4" }]);

    const date = page.getByLabel("Ngày thi (tùy chọn)");
    await date.fill("2020-01-01");
    await date.blur();
    await expect(page.getByText("Ngày thi phải từ hôm nay trở đi.")).toBeVisible();
    expect(backend.patches).toHaveLength(1);

    await date.fill("2099-12-06");
    await date.blur();
    await expect.poll(() => backend.patches.length).toBe(2);
    expect(backend.patches[1]).toEqual({ exam_date: "2099-12-06" });

    await page.getByRole("button", { name: "Xóa ngày thi" }).click();
    await expect.poll(() => backend.patches.length).toBe(3);
    expect(backend.patches[2]).toEqual({ exam_date: null });
  });

  test("lưu lỗi mạng: báo và thử lại được", async ({ page }) => {
    const backend = await openSettings(page);
    backend.failPatch = true;
    await page.getByLabel("Thẻ mới mỗi ngày").fill("9");
    await expect(page.getByText("Chưa lưu được.")).toBeVisible();
    backend.failPatch = false;
    await page.getByRole("button", { name: "Thử lại" }).click();
    await expect(page.getByText("Đã lưu")).toBeVisible();
    expect(backend.patches).toEqual([{ new_per_day: 9 }]);
  });

  test("không có vi phạm axe WCAG A/AA, không tràn ngang ở 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openSettings(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
