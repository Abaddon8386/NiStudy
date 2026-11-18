/** Phân loại lỗi Supabase Auth (FR-01, FR-02, NFR-24). Hàm thuần, không phụ thuộc SDK. */
export type AuthErrorKind = "rate_limit" | "already_exists" | "other";

const RATE_LIMIT_CODES = new Set(["over_request_rate_limit", "over_email_send_rate_limit"]);
const EXISTS_CODES = new Set(["user_already_exists", "email_exists"]);

export function classifyAuthError(
  error: { status?: number | null; code?: string | null } | null | undefined,
): AuthErrorKind {
  if (!error) return "other";
  if (error.status === 429 || (error.code && RATE_LIMIT_CODES.has(error.code))) return "rate_limit";
  if (error.code && EXISTS_CODES.has(error.code)) return "already_exists";
  return "other";
}

export const AUTH_MESSAGES = {
  passwordTooShort: "Mật khẩu cần tối thiểu 8 ký tự",
  passwordMismatch: "Hai mật khẩu chưa khớp.",
  rateLimit: "Bạn thao tác quá nhanh. Hãy thử lại sau ít phút.",
  generic: "Có lỗi xảy ra. Hãy thử lại.",
  invalidLogin: "Email hoặc mật khẩu không đúng.",
  resent: "Nếu email này đăng ký được, bạn sẽ nhận được email trong ít phút.",
  resetSent: "Nếu email này có tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu trong ít phút.",
} as const;

export const MIN_PASSWORD_LENGTH = 8;
