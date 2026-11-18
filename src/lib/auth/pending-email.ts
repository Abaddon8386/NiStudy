// Email chờ xác nhận lưu trong sessionStorage (không đưa email vào URL).
const KEY = "nihongo:pending-email";

export function setPendingEmail(email: string) {
  try {
    sessionStorage.setItem(KEY, email);
  } catch {
    /* sessionStorage không dùng được: màn S-04 sẽ hiện ô nhập email */
  }
}

export function getPendingEmail(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
