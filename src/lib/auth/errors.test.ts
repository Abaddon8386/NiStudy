import { describe, expect, it } from "vitest";
import { classifyAuthError } from "./errors";

describe("classifyAuthError", () => {
  it("429 là rate_limit", () => {
    expect(classifyAuthError({ status: 429 })).toBe("rate_limit");
  });
  it("mã over_request_rate_limit và over_email_send_rate_limit là rate_limit", () => {
    expect(classifyAuthError({ status: 400, code: "over_request_rate_limit" })).toBe("rate_limit");
    expect(classifyAuthError({ code: "over_email_send_rate_limit" })).toBe("rate_limit");
  });
  it("user_already_exists và email_exists là already_exists", () => {
    expect(classifyAuthError({ status: 422, code: "user_already_exists" })).toBe("already_exists");
    expect(classifyAuthError({ code: "email_exists" })).toBe("already_exists");
  });
  it("rate_limit thắng khi có cả status 429 lẫn mã khác", () => {
    expect(classifyAuthError({ status: 429, code: "user_already_exists" })).toBe("rate_limit");
  });
  it("lỗi khác, null, undefined, status 0 là other", () => {
    expect(classifyAuthError({ status: 400, code: "invalid_credentials" })).toBe("other");
    expect(classifyAuthError({ code: "email_not_confirmed" })).toBe("other");
    expect(classifyAuthError({ status: 0 })).toBe("other");
    expect(classifyAuthError({})).toBe("other");
    expect(classifyAuthError(null)).toBe("other");
    expect(classifyAuthError(undefined)).toBe("other");
  });
});
