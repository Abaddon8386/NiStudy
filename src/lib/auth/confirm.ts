import type { EmailOtpType } from "@supabase/supabase-js";

/** Đích lỗi cố định (không nhận URL tùy ý: chống open redirect). */
export const CONFIRM_FAILED = "/dang-nhap?loi=lien-ket-het-han";
/** Xác nhận email lỗi: có thể email đã được xác nhận, hoặc mở liên kết ở trình duyệt khác (thiếu code verifier PKCE). */
export const CONFIRM_EMAIL_FAILED = "/dang-nhap?loi=xac-nhan";
const AFTER_SIGNUP = "/khoi-dau";
const AFTER_RECOVERY = "/dat-lai-mat-khau";

const OTP_TARGETS: Partial<Record<EmailOtpType, string>> = {
  email: AFTER_SIGNUP,
  signup: AFTER_SIGNUP,
  recovery: AFTER_RECOVERY,
};

/** `onFail`: đích khi lỗi. Luồng đặt lại mật khẩu giữ thông báo hết hạn; luồng xác nhận email dùng thông báo riêng. */
export type ConfirmPlan =
  | { kind: "fail"; onFail: string }
  | { kind: "verify_otp"; tokenHash: string; type: EmailOtpType; target: string; onFail: string }
  | { kind: "exchange_code"; code: string; target: string; onFail: string };

/**
 * Chọn cách xử lý liên kết từ email:
 * - có error/error_code (vd otp_expired) -> thất bại;
 * - token_hash + type hợp lệ -> verifyOtp (mẫu email tùy chỉnh);
 * - code -> exchangeCodeForSession (PKCE, mẫu mặc định); luong=dat-lai -> đặt lại mật khẩu, còn lại -> khởi đầu.
 */
export function planConfirm(params: URLSearchParams): ConfirmPlan {
  const type = params.get("type") as EmailOtpType | null;
  const recovery = params.get("luong") === "dat-lai" || type === "recovery";
  const onFail = recovery ? CONFIRM_FAILED : CONFIRM_EMAIL_FAILED;

  if (params.has("error") || params.has("error_code")) return { kind: "fail", onFail };

  const tokenHash = params.get("token_hash");
  const otpTarget = type ? OTP_TARGETS[type] : undefined;
  if (tokenHash && type && otpTarget) {
    return { kind: "verify_otp", tokenHash, type, target: otpTarget, onFail };
  }

  const code = params.get("code");
  if (code) {
    return {
      kind: "exchange_code",
      code,
      target: params.get("luong") === "dat-lai" ? AFTER_RECOVERY : AFTER_SIGNUP,
      onFail,
    };
  }
  return { kind: "fail", onFail };
}
