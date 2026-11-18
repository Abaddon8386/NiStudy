import type { EmailOtpType } from "@supabase/supabase-js";

/** Đích chuyển hướng cố định (không nhận URL tùy ý: chống open redirect). */
export const CONFIRM_FAILED = "/dang-nhap?loi=lien-ket-het-han";
const AFTER_SIGNUP = "/khoi-dau";
const AFTER_RECOVERY = "/dat-lai-mat-khau";

const OTP_TARGETS: Partial<Record<EmailOtpType, string>> = {
  email: AFTER_SIGNUP,
  signup: AFTER_SIGNUP,
  recovery: AFTER_RECOVERY,
};

export type ConfirmPlan =
  | { kind: "fail" }
  | { kind: "verify_otp"; tokenHash: string; type: EmailOtpType; target: string }
  | { kind: "exchange_code"; code: string; target: string };

/**
 * Chọn cách xử lý liên kết từ email:
 * - có error/error_code (vd otp_expired) -> thất bại;
 * - token_hash + type hợp lệ -> verifyOtp (mẫu email tùy chỉnh);
 * - code -> exchangeCodeForSession (PKCE, mẫu mặc định); luong=dat-lai -> đặt lại mật khẩu, còn lại -> khởi đầu.
 */
export function planConfirm(params: URLSearchParams): ConfirmPlan {
  if (params.has("error") || params.has("error_code")) return { kind: "fail" };

  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const otpTarget = type ? OTP_TARGETS[type] : undefined;
  if (tokenHash && type && otpTarget) {
    return { kind: "verify_otp", tokenHash, type, target: otpTarget };
  }

  const code = params.get("code");
  if (code) {
    return {
      kind: "exchange_code",
      code,
      target: params.get("luong") === "dat-lai" ? AFTER_RECOVERY : AFTER_SIGNUP,
    };
  }
  return { kind: "fail" };
}
