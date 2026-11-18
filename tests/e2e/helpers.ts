import type { Page } from "@playwright/test";

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");

/** Phiên giả (JWT không ký) để thử guard; KHÔNG gọi Supabase thật. */
function fakeSession() {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const user = {
    id: "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "hoc@example.test",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-11-18T00:00:00Z",
  };
  const access_token = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, role: "authenticated", exp })}.sig`;
  return { access_token, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "fake-refresh", user };
}

export interface MockBackend {
  /** Body JSON của mọi PATCH gửi tới profiles. */
  patches: Record<string, unknown>[];
  /** Hàng profile hiện tại (PATCH cập nhật vào đây). */
  row: Record<string, unknown>;
  /** true: PATCH trả lỗi mạng. */
  failPatch: boolean;
}

/** Chặn Supabase Auth và profiles bằng phản hồi giả: đăng nhập thành công, profile theo `onboarded`. */
export async function mockLoggedInBackend(page: Page, onboarded = true): Promise<MockBackend> {
  const state: MockBackend = {
    patches: [],
    failPatch: false,
    row: {
      level: "N5",
      knows_kana: false,
      new_per_day: 10,
      review_limit: 100,
      exam_date: null,
      onboarded_at: onboarded ? "2026-11-18T00:00:00Z" : null,
    },
  };
  await page.route("**/auth/v1/**", (route) => {
    const url = route.request().url();
    if (url.includes("/token")) return route.fulfill({ json: fakeSession() });
    if (url.includes("/logout")) return route.fulfill({ status: 204, body: "" });
    return route.fulfill({ status: 404, json: { error_code: "not_found", msg: "mock" } });
  });
  await page.route("**/rest/v1/profiles**", (route) => {
    const req = route.request();
    if (req.method() === "PATCH") {
      if (state.failPatch) return route.abort("failed");
      const body = JSON.parse(req.postData() ?? "{}") as Record<string, unknown>;
      state.patches.push(body);
      Object.assign(state.row, body);
      // Client gọi .select("user_id") sau update: trả lại dòng đã sửa như PostgREST.
      return route.fulfill({ contentType: "application/json", body: JSON.stringify([{ user_id: "u" }]) });
    }
    const single = (req.headers()["accept"] ?? "").includes("vnd.pgrst.object");
    return route.fulfill({
      contentType: single ? "application/vnd.pgrst.object+json" : "application/json",
      body: JSON.stringify(single ? state.row : [state.row]),
    });
  });
  return state;
}

export async function loginViaForm(page: Page) {
  await page.goto("/dang-nhap");
  await page.getByLabel("Email").fill("hoc@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("matkhau-hop-le");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}
