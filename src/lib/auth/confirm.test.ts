import { describe, expect, it } from "vitest";
import { CONFIRM_EMAIL_FAILED, CONFIRM_FAILED, planConfirm } from "./confirm";

const plan = (q: string) => planConfirm(new URLSearchParams(q));

describe("planConfirm", () => {
  it("token_hash + type email/signup -> verifyOtp tới /khoi-dau", () => {
    expect(plan("token_hash=h&type=email")).toEqual({
      kind: "verify_otp",
      tokenHash: "h",
      type: "email",
      target: "/khoi-dau",
      onFail: CONFIRM_EMAIL_FAILED,
    });
    expect(plan("token_hash=h&type=signup")).toMatchObject({ kind: "verify_otp", target: "/khoi-dau" });
  });
  it("token_hash + type recovery -> /dat-lai-mat-khau", () => {
    expect(plan("token_hash=h&type=recovery")).toMatchObject({ kind: "verify_otp", target: "/dat-lai-mat-khau" });
  });
  it("code mặc định -> exchange tới /khoi-dau", () => {
    expect(plan("code=abc")).toEqual({ kind: "exchange_code", code: "abc", target: "/khoi-dau", onFail: CONFIRM_EMAIL_FAILED });
  });
  it("code + luong=dat-lai -> /dat-lai-mat-khau", () => {
    expect(plan("code=abc&luong=dat-lai")).toMatchObject({ kind: "exchange_code", target: "/dat-lai-mat-khau" });
  });
  it("luong khác hoặc URL tùy ý không đổi đích", () => {
    expect(plan("code=abc&luong=https://evil.example")).toMatchObject({ target: "/khoi-dau" });
    expect(plan("code=abc&next=https://evil.example")).toMatchObject({ target: "/khoi-dau" });
  });
  it("error hoặc error_code -> fail, kể cả khi có code", () => {
    expect(plan("error=access_denied&error_code=otp_expired")).toEqual({ kind: "fail", onFail: CONFIRM_EMAIL_FAILED });
    expect(plan("code=abc&error_code=otp_expired")).toEqual({ kind: "fail", onFail: CONFIRM_EMAIL_FAILED });
    expect(plan("code=abc&error=x")).toEqual({ kind: "fail", onFail: CONFIRM_EMAIL_FAILED });
  });
  it("thiếu tham số hoặc type lạ không có code -> fail", () => {
    expect(plan("")).toEqual({ kind: "fail", onFail: CONFIRM_EMAIL_FAILED });
    expect(plan("token_hash=h")).toEqual({ kind: "fail", onFail: CONFIRM_EMAIL_FAILED });
    expect(plan("token_hash=h&type=magiclink")).toEqual({ kind: "fail", onFail: CONFIRM_EMAIL_FAILED });
    expect(plan("type=email")).toEqual({ kind: "fail", onFail: CONFIRM_EMAIL_FAILED });
  });
  it("type lạ nhưng có code thì dùng code", () => {
    expect(plan("token_hash=h&type=magiclink&code=c")).toMatchObject({ kind: "exchange_code" });
  });
  it("đích lỗi: xác nhận email -> loi=xac-nhan; đặt lại mật khẩu -> loi=lien-ket-het-han", () => {
    expect(plan("code=abc")).toMatchObject({ onFail: "/dang-nhap?loi=xac-nhan" });
    expect(plan("token_hash=h&type=signup")).toMatchObject({ onFail: CONFIRM_EMAIL_FAILED });
    expect(plan("code=abc&luong=dat-lai")).toMatchObject({ onFail: CONFIRM_FAILED });
    expect(plan("token_hash=h&type=recovery")).toMatchObject({ onFail: CONFIRM_FAILED });
    expect(plan("luong=dat-lai&error_code=otp_expired")).toEqual({ kind: "fail", onFail: CONFIRM_FAILED });
    expect(plan("")).toEqual({ kind: "fail", onFail: CONFIRM_EMAIL_FAILED });
    expect(CONFIRM_FAILED).toBe("/dang-nhap?loi=lien-ket-het-han");
    expect(CONFIRM_EMAIL_FAILED).toBe("/dang-nhap?loi=xac-nhan");
  });
});
