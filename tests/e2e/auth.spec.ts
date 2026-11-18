import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

const AUTH_URL = "**/auth/v1/**";
const RATE_LIMITED = { status: 429, json: { code: 429, error_code: "over_request_rate_limit", msg: "rate" } };

async function fillSignUp(page: Page, password: string) {
  await page.goto("/dang-ky");
  await page.getByLabel("Email").fill("moi@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
}

test.describe("đăng ký", () => {
  test("mật khẩu 7 ký tự bị từ chối, không gửi request", async ({ page }) => {
    let calls = 0;
    await page.route(AUTH_URL, (route) => {
      calls++;
      return route.abort();
    });
    await fillSignUp(page, "1234567");
    await expect(page.locator("main").getByRole("alert")).toHaveText("Mật khẩu cần tối thiểu 8 ký tự");
    await expect(page).toHaveURL(/\/dang-ky$/);
    expect(calls).toBe(0);
  });

  test("email mới và email đã tồn tại đều dẫn tới cùng thông báo (FR-01)", async ({ page }) => {
    await page.route(AUTH_URL, (route) =>
      route.fulfill({
        json: { id: "00000000-0000-4000-8000-000000000002", aud: "authenticated", email: "moi@example.test", identities: [{}] },
      }),
    );
    await fillSignUp(page, "12345678");
    await expect(page).toHaveURL(/\/kiem-tra-hop-thu$/);
    expect(page.url()).not.toContain("example.test");
    const created = await page.locator("main").innerText();

    await page.unroute(AUTH_URL);
    await page.route(AUTH_URL, (route) =>
      route.fulfill({ status: 422, json: { code: 422, error_code: "user_already_exists", msg: "User already registered" } }),
    );
    await fillSignUp(page, "12345678");
    await expect(page).toHaveURL(/\/kiem-tra-hop-thu$/);
    expect(await page.locator("main").innerText()).toBe(created);
  });

  test("rate limit hiện thông báo quá nhanh", async ({ page }) => {
    await page.route(AUTH_URL, (route) => route.fulfill(RATE_LIMITED));
    await fillSignUp(page, "12345678");
    await expect(page.locator("main").getByRole("alert")).toHaveText("Bạn thao tác quá nhanh. Hãy thử lại sau ít phút.");
  });
});

test.describe("đăng nhập", () => {
  for (const code of ["invalid_credentials", "email_not_confirmed"]) {
    test(`${code}: cùng một câu lỗi và liên kết gợi ý`, async ({ page }) => {
      await page.route(AUTH_URL, (route) => route.fulfill({ status: 400, json: { code: 400, error_code: code, msg: code } }));
      await loginViaForm(page);
      await expect(page.locator("main").getByRole("alert")).toHaveText("Email hoặc mật khẩu không đúng.");
      await expect(page.getByRole("link", { name: "Chưa nhận email xác nhận?" })).toHaveAttribute("href", "/kiem-tra-hop-thu");
      await expect(page.getByRole("link", { name: "Quên mật khẩu?" })).toHaveAttribute("href", "/quen-mat-khau");
    });
  }

  test("rate limit hiện thông báo quá nhanh", async ({ page }) => {
    await page.route(AUTH_URL, (route) => route.fulfill(RATE_LIMITED));
    await loginViaForm(page);
    await expect(page.locator("main").getByRole("alert")).toHaveText("Bạn thao tác quá nhanh. Hãy thử lại sau ít phút.");
  });

  test("thành công vào trang chính; đăng xuất về trang đăng nhập và bị chặn lại", async ({ page }) => {
    await mockLoggedInBackend(page);
    await loginViaForm(page);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Nihongo" })).toBeVisible();

    await page.getByRole("link", { name: "Cài đặt" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Cài đặt" })).toBeVisible();
    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page).toHaveURL(/\/dang-nhap$/);

    await page.goto("/");
    await expect(page).toHaveURL(/\/dang-nhap$/);
  });

  test("chưa khởi đầu (onboarded_at null) thì chuyển sang /khoi-dau", async ({ page }) => {
    await mockLoggedInBackend(page, false);
    await loginViaForm(page);
    await expect(page).toHaveURL(/\/khoi-dau$/);
    await expect(page.getByRole("heading", { level: 1, name: "Khởi đầu" })).toBeVisible();
  });
});

test.describe("quên mật khẩu và gửi lại", () => {
  test("quên mật khẩu: cùng thông báo dù lỗi gì", async ({ page }) => {
    await page.route(AUTH_URL, (route) => route.fulfill({ status: 500, json: { msg: "boom" } }));
    await page.goto("/quen-mat-khau");
    await page.getByLabel("Email").fill("a@example.test");
    await page.getByRole("button", { name: "Gửi liên kết" }).click();
    await expect(page.getByRole("status")).toContainText("Nếu email này có tài khoản");
  });

  test("gửi lại email xác nhận: thông báo trung tính", async ({ page }) => {
    await page.route(AUTH_URL, (route) => route.fulfill({ status: 500, json: { msg: "boom" } }));
    await page.goto("/kiem-tra-hop-thu");
    await page.getByLabel("Email").fill("a@example.test");
    await page.getByRole("button", { name: "Gửi lại email" }).click();
    await expect(page.getByRole("status")).toContainText("Nếu email này đăng ký được");
  });

  test("đặt lại mật khẩu không có phiên: báo liên kết hết hạn", async ({ page }) => {
    await page.goto("/dat-lai-mat-khau");
    await expect(page.locator("main").getByRole("alert")).toContainText("hết hạn");
    await expect(page.getByRole("link", { name: /Gửi lại liên kết/ })).toBeVisible();
  });
});

test.describe("/auth/confirm", () => {
  test("thiếu token, type lạ hoặc có error: về đăng nhập kèm báo hết hạn", async ({ page }) => {
    const queries = [
      "",
      "?token_hash=abc&type=magiclink&next=https://evil.example",
      "?type=email",
      "?error=access_denied&error_code=otp_expired",
    ];
    for (const q of queries) {
      await page.goto(`/auth/confirm${q}`);
      await expect(page).toHaveURL(/\/dang-nhap\?loi=lien-ket-het-han$/);
      await expect(page.locator("main").getByRole("alert")).toContainText("hết hạn");
    }
  });
});

test.describe("chặn trang cần đăng nhập", () => {
  for (const path of ["/", "/cai-dat", "/khoi-dau"]) {
    test(`chưa đăng nhập mở ${path} bị đưa về /dang-nhap`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/dang-nhap$/);
    });
  }
});

test.describe("accessibility (axe)", () => {
  for (const path of ["/dang-ky", "/dang-nhap", "/quen-mat-khau", "/kiem-tra-hop-thu"]) {
    test(`${path} không có vi phạm WCAG A/AA`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
    });
  }
});
