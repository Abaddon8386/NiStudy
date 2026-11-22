import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

const WRONG = "Mật khẩu không đúng.";
const FAILED = "Chưa xóa được tài khoản. Dữ liệu của bạn vẫn còn nguyên. Hãy thử lại.";

async function openSettings(page: Page) {
  await mockLoggedInBackend(page, true);
  await loginViaForm(page);
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("link", { name: "Cài đặt" }).click();
  await expect(page.getByLabel("Thẻ mới mỗi ngày")).toBeVisible();
}

async function openDialog(page: Page) {
  await page.getByRole("button", { name: "Xóa tài khoản" }).click();
  const dialog = page.getByRole("dialog", { name: "Xóa tài khoản?" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("xóa tài khoản (S-13)", () => {
  test("mở hộp: focus vào ô mật khẩu, nút vô hiệu khi rỗng, Escape đóng và trả focus", async ({ page }) => {
    await openSettings(page);
    const dialog = await openDialog(page);
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog.getByLabel("Nhập lại mật khẩu")).toBeFocused();
    await expect(dialog.getByLabel("Nhập lại mật khẩu")).toHaveAttribute("autocomplete", "current-password");
    const del = dialog.getByRole("button", { name: "Xóa vĩnh viễn" });
    await expect(del).toHaveAttribute("aria-disabled", "true");
    await expect(del).not.toHaveAttribute("disabled"); // aria-disabled, không phải disabled: vẫn focus được
    await expect(dialog.getByText("Nhập mật khẩu để mở nút xóa.")).toBeVisible();
    await del.click({ force: true });
    await expect(dialog).toBeVisible(); // bấm khi chưa nhập không gửi gì
    await dialog.getByLabel("Nhập lại mật khẩu").fill("abc");
    await expect(del).not.toHaveAttribute("aria-disabled", "true");
    await expect(dialog.getByText("Nhập mật khẩu để mở nút xóa.")).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Xóa tài khoản" })).toBeFocused();
  });

  test("đang gửi: nút bận (disabled + aria-busy), khác với trạng thái chưa nhập", async ({ page }) => {
    await openSettings(page);
    await page.route("**/api/account/delete", async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({ status: 500, json: { error: "khong-xoa-duoc" } });
    });
    const dialog = await openDialog(page);
    await dialog.getByLabel("Nhập lại mật khẩu").fill("abc");
    const del = dialog.getByRole("button", { name: "Xóa vĩnh viễn" });
    await del.click();
    await expect(del).toBeDisabled();
    await expect(del).toHaveAttribute("aria-busy", "true");
    await expect(del).not.toHaveAttribute("aria-disabled", "true");
    await expect(dialog.getByRole("alert")).toHaveText(FAILED);
    await expect(del).not.toHaveAttribute("disabled");
  });

  test("Tab và Shift+Tab không thoát khỏi hộp", async ({ page }) => {
    await openSettings(page);
    const dialog = await openDialog(page);
    await dialog.getByLabel("Nhập lại mật khẩu").fill("abc");
    const inside = () => page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"));
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await inside()).toBe(true);
    }
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(await inside()).toBe(true);
    }
  });

  test("403 sai mật khẩu: báo đúng câu, dữ liệu cục bộ còn nguyên", async ({ page }) => {
    await openSettings(page);
    await page.route("**/api/account/delete", (route) => route.fulfill({ status: 403, json: { error: "sai-mat-khau" } }));
    await page.evaluate(() => new Promise<void>((r) => (indexedDB.open("nihongo-test").onsuccess = () => r())));
    const dialog = await openDialog(page);
    await dialog.getByLabel("Nhập lại mật khẩu").fill("sai");
    await dialog.getByRole("button", { name: "Xóa vĩnh viễn" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(WRONG);
    await expect(dialog).toBeVisible();
    const names = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
    expect(names).toContain("nihongo-test");
  });

  test("500: báo chưa xóa được, không chuyển trang", async ({ page }) => {
    await openSettings(page);
    await page.route("**/api/account/delete", (route) => route.fulfill({ status: 500, json: { error: "khong-xoa-duoc" } }));
    const dialog = await openDialog(page);
    await dialog.getByLabel("Nhập lại mật khẩu").fill("abc");
    await dialog.getByRole("button", { name: "Xóa vĩnh viễn" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(FAILED);
    await expect(page).toHaveURL(/\/cai-dat$/);
  });

  test("200: xóa dữ liệu cục bộ, về /dang-nhap?da-xoa=1 và báo đã xóa", async ({ page }) => {
    await openSettings(page);
    let body = "";
    await page.route("**/api/account/delete", (route) => {
      body = route.request().postData() ?? "";
      return route.fulfill({ status: 200, json: { ok: true } });
    });
    await page.evaluate(() => new Promise<void>((r) => (indexedDB.open("nihongo-test").onsuccess = () => r())));
    const dialog = await openDialog(page);
    await dialog.getByLabel("Nhập lại mật khẩu").fill("matkhau-hop-le");
    await dialog.getByRole("button", { name: "Xóa vĩnh viễn" }).click();
    await expect(page).toHaveURL(/\/dang-nhap\?da-xoa=1$/);
    await expect(page.getByText("Tài khoản đã được xóa.")).toBeVisible();
    expect(JSON.parse(body)).toEqual({ password: "matkhau-hop-le" });
    const names = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
    expect(names).not.toContain("nihongo-test");
  });

  for (const [w, h] of [
    [1280, 800],
    [375, 812],
  ] as const) {
    test(`axe 0 vi phạm A/AA khi hộp mở ở ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await openSettings(page);
      await openDialog(page);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
    });
  }
});

test.describe("POST /api/account/delete (route thật)", () => {
  const url = "/api/account/delete";
  const json = { "Content-Type": "application/json" };

  test("không có Origin: 403", async ({ request }) => {
    const res = await request.post(url, { headers: json, data: { password: "x" } });
    expect(res.status()).toBe(403);
    expect(await res.json()).toEqual({ error: "origin" });
  });

  test("Origin lạ: 403", async ({ request }) => {
    const res = await request.post(url, { headers: { ...json, Origin: "https://evil.example" }, data: { password: "x" } });
    expect(res.status()).toBe(403);
  });

  test("content-type sai: 415", async ({ request, baseURL }) => {
    const res = await request.post(url, {
      headers: { "Content-Type": "text/plain", Origin: baseURL! },
      data: '{"password":"x"}',
    });
    expect(res.status()).toBe(415);
  });

  test("body sai: 400", async ({ request, baseURL }) => {
    const res = await request.post(url, { headers: { ...json, Origin: baseURL! }, data: { password: "" } });
    expect(res.status()).toBe(400);
  });

  test("không có phiên: 401", async ({ request, baseURL }) => {
    const res = await request.post(url, { headers: { ...json, Origin: baseURL! }, data: { password: "x" } });
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: "chua-dang-nhap" });
  });

  test("GET không được hỗ trợ: 405", async ({ request }) => {
    const res = await request.get(url);
    expect(res.status()).toBe(405);
  });
});
