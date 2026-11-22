/** Kiểm tra email phía client trước khi gọi Supabase (form dùng noValidate). Chỉ bắt lỗi rõ ràng, máy chủ vẫn quyết định. */
export const EMAIL_MESSAGES = {
  required: "Nhập email của bạn.",
  invalid: "Email chưa đúng định dạng, ví dụ ten@example.com.",
} as const;

export const PASSWORD_REQUIRED_MESSAGE = "Nhập mật khẩu.";

/** Trả câu lỗi, hoặc chuỗi rỗng nếu hợp lệ. */
export function emailProblem(email: string): string {
  const v = email.trim();
  if (!v) return EMAIL_MESSAGES.required;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : EMAIL_MESSAGES.invalid;
}
