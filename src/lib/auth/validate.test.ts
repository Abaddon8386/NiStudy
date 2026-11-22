import { describe, expect, it } from "vitest";
import { EMAIL_MESSAGES, emailProblem } from "./validate";

describe("emailProblem", () => {
  it("rỗng hoặc chỉ khoảng trắng: báo thiếu", () => {
    expect(emailProblem("")).toBe(EMAIL_MESSAGES.required);
    expect(emailProblem("   ")).toBe(EMAIL_MESSAGES.required);
  });
  it("thiếu @ hoặc tên miền: báo sai định dạng", () => {
    expect(emailProblem("abc")).toBe(EMAIL_MESSAGES.invalid);
    expect(emailProblem("a@b")).toBe(EMAIL_MESSAGES.invalid);
    expect(emailProblem("a b@c.d")).toBe(EMAIL_MESSAGES.invalid);
  });
  it("email hợp lệ: không lỗi", () => {
    expect(emailProblem("hoc@example.test")).toBe("");
    expect(emailProblem("  hoc@example.test ")).toBe("");
  });
});
