import { describe, expect, it } from "vitest";
import {
  checkRequestHeaders,
  classifyVerifyError,
  deleteErrorMessage,
  DELETE_STATUS,
  parseDeleteBody,
} from "./validate";

const URL_ = "https://app.example.com/api/account/delete";
const OK_ORIGIN = "https://app.example.com";

describe("checkRequestHeaders", () => {
  it("cho qua cùng origin và JSON (kể cả charset)", () => {
    expect(checkRequestHeaders(URL_, OK_ORIGIN, "application/json")).toBeNull();
    expect(checkRequestHeaders(URL_, OK_ORIGIN, "Application/JSON; charset=utf-8")).toBeNull();
  });
  it("chặn thiếu hoặc lạ Origin", () => {
    expect(checkRequestHeaders(URL_, null, "application/json")).toBe("origin");
    expect(checkRequestHeaders(URL_, "https://evil.example", "application/json")).toBe("origin");
    expect(checkRequestHeaders(URL_, "http://app.example.com", "application/json")).toBe("origin");
    expect(checkRequestHeaders(URL_, "null", "application/json")).toBe("origin");
  });
  it("chặn content-type khác JSON", () => {
    expect(checkRequestHeaders(URL_, OK_ORIGIN, "text/plain")).toBe("content-type");
    expect(checkRequestHeaders(URL_, OK_ORIGIN, null)).toBe("content-type");
    expect(checkRequestHeaders(URL_, OK_ORIGIN, "application/x-www-form-urlencoded")).toBe("content-type");
  });
});

describe("parseDeleteBody", () => {
  it("nhận mật khẩu hợp lệ", () => {
    expect(parseDeleteBody({ password: "x" })).toEqual({ password: "x" });
    expect(parseDeleteBody({ password: "a".repeat(200) })).not.toBeNull();
  });
  it("từ chối body sai", () => {
    const bad: unknown[] = [null, undefined, [], "x", 1, {}, { password: "" }, { password: 1 }, { password: "a".repeat(201) }];
    for (const b of bad) expect(parseDeleteBody(b)).toBeNull();
  });
});

describe("classifyVerifyError và thông báo", () => {
  it("phân loại lỗi xác minh", () => {
    expect(classifyVerifyError({ status: 429 })).toBe("qua-nhanh");
    expect(classifyVerifyError({ code: "over_request_rate_limit" })).toBe("qua-nhanh");
    expect(classifyVerifyError({ status: 400, code: "invalid_credentials" })).toBe("sai-mat-khau");
    expect(classifyVerifyError(null)).toBe("sai-mat-khau");
  });
  it("ánh xạ câu tiếng Việt", () => {
    expect(deleteErrorMessage("sai-mat-khau")).toBe("Mật khẩu không đúng.");
    expect(deleteErrorMessage("qua-nhanh")).toContain("quá nhanh");
    expect(deleteErrorMessage("khong-xoa-duoc")).toContain("Dữ liệu của bạn vẫn còn nguyên");
    expect(deleteErrorMessage(undefined)).toContain("Chưa xóa được");
  });
  it("mã trạng thái", () => {
    expect(DELETE_STATUS["sai-mat-khau"]).toBe(403);
    expect(DELETE_STATUS["chua-dang-nhap"]).toBe(401);
  });
});
