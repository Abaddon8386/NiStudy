/** Số hiển thị ở trang chính tính phía client (FR-21, FR-24). */

export const DEFAULT_SECONDS_PER_REVIEW = 20;

/** Phút ước tính = ceil(số thẻ x giây mỗi lượt / 60); 0 khi hàng đợi rỗng. */
export function estimateMinutes(queueSize: number, medianSeconds: number | null): number {
  if (queueSize <= 0) return 0;
  return Math.ceil((queueSize * (medianSeconds ?? DEFAULT_SECONDS_PER_REVIEW)) / 60);
}

export type ExamCountdown =
  | null
  | { kind: "today" }
  | { kind: "days"; days: number }
  | { kind: "past" };

/** Đếm ngược ngày thi; cả hai tham số là "YYYY-MM-DD". */
export function examCountdown(examDate: string | null, today: string): ExamCountdown {
  if (!examDate) return null;
  const days = Math.round(
    (Date.parse(`${examDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );
  if (days === 0) return { kind: "today" };
  return days > 0 ? { kind: "days", days } : { kind: "past" };
}
