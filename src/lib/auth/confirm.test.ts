import { describe, expect, it } from "vitest";
import { CONFIRM_FAILED, planConfirm } from "./confirm";

const plan = (q: string) => planConfirm(new URLSearchParams(q));

describe("planConfirm", () => {
  it("token_hash + type email/signup -> verifyOtp tới /khoi-dau", () => {
    expect(plan("token_hash=h&type=email")).toEqual({ kind: "verify_otp", tokenHash: "h", type: "email", target: "/khoi-dau" });
    expect(plan("token_hash=h&type=signup")).toMatchObject({ kind: "verify_otp", target: "/khoi-dau" });
  });
  it("token_hash + type recovery -> /dat-lai-mat-khau", () => {
    expect(plan("token_hash=h&type=recovery")).toMatchObject({ kind: "verify_otp", target: "/dat-lai-mat-khau" });
  });
  it("code mặc định -> exchange tới /khoi-dau", () => {
    expect(plan("code=abc")).toEqual({ kind: "exchange_code", code: "abc", target: "/khoi-dau" });
  });
  it("code + luong=dat-lai -> /dat-lai-mat-khau", () => {
    expect(plan("code=abc&luong=dat-lai")).toMatchObject({ kind: "exchange_code", target: "/dat-lai-mat-khau" });
  });
  it("luong khác hoặc URL tùy ý không đổi đích", () => {
    expect(plan("code=abc&luong=https://evil.example")).toMatchObject({ target: "/khoi-dau" });
    expect(plan("code=abc&next=https://evil.example")).toMatchObject({ target: "/khoi-dau" });
  });
  it("error hoặc error_code -> fail, kể cả khi có code", () => {
    expect(plan("error=access_denied&error_code=otp_expired")).toEqual({ kind: "fail" });
    expect(plan("code=abc&error_code=otp_expired")).toEqual({ kind: "fail" });
    expect(plan("code=abc&error=x")).toEqual({ kind: "fail" });
  });
  it("thiếu tham số hoặc type lạ không có code -> fail", () => {
    expect(plan("")).toEqual({ kind: "fail" });
    expect(plan("token_hash=h")).toEqual({ kind: "fail" });
    expect(plan("token_hash=h&type=magiclink")).toEqual({ kind: "fail" });
    expect(plan("type=email")).toEqual({ kind: "fail" });
  });
  it("type lạ nhưng có code thì dùng code", () => {
    expect(plan("token_hash=h&type=magiclink&code=c")).toMatchObject({ kind: "exchange_code" });
  });
  it("hằng đích lỗi", () => {
    expect(CONFIRM_FAILED).toBe("/dang-nhap?loi=lien-ket-het-han");
  });
});
