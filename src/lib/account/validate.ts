/** Hàm thuần kiểm yêu cầu xóa tài khoản (FR-05, ADR-0006). Không phụ thuộc Next/Supabase. */

export type DeleteErrorCode =
  | "origin"
  | "content-type"
  | "body"
  | "chua-dang-nhap"
  | "sai-mat-khau"
  | "qua-nhanh"
  | "khong-xoa-duoc";

export const DELETE_STATUS: Record<DeleteErrorCode, number> = {
  origin: 403,
  "content-type": 415,
  body: 400,
  "chua-dang-nhap": 401,
  "sai-mat-khau": 403,
  "qua-nhanh": 429,
  "khong-xoa-duoc": 500,
};

/** Chỉ nhận cùng origin: header Origin phải có và trùng origin của request; Content-Type phải là JSON. */
export function checkRequestHeaders(
  requestUrl: string,
  origin: string | null,
  contentType: string | null,
): DeleteErrorCode | null {
  let own: string;
  try {
    own = new URL(requestUrl).origin;
  } catch {
    return "origin";
  }
  if (!origin || origin !== own) return "origin";
  const mime = (contentType ?? "").split(";")[0].trim().toLowerCase();
  if (mime !== "application/json") return "content-type";
  return null;
}

/** Body phải là { password: string } dài 1..200. */
export function parseDeleteBody(body: unknown): { password: string } | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const password = (body as Record<string, unknown>).password;
  if (typeof password !== "string" || password.length < 1 || password.length > 200) return null;
  return { password };
}

/** Lỗi từ signInWithPassword: giới hạn tần suất -> qua-nhanh, còn lại -> sai-mat-khau. */
export function classifyVerifyError(err: { status?: number; code?: string } | null | undefined): DeleteErrorCode {
  if (err && (err.status === 429 || err.code === "over_request_rate_limit")) return "qua-nhanh";
  return "sai-mat-khau";
}

/** Câu tiếng Việt cho từng mã lỗi trả về từ API (client). */
export function deleteErrorMessage(code: string | undefined): string {
  if (code === "sai-mat-khau") return "Mật khẩu không đúng.";
  if (code === "qua-nhanh") return "Bạn thao tác quá nhanh. Hãy thử lại sau ít phút.";
  return "Chưa xóa được tài khoản. Dữ liệu của bạn vẫn còn nguyên. Hãy thử lại.";
}
