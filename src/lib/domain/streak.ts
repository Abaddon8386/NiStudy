/** Chuỗi ngày và tổng ngày học (FR-22). Ngày là chuỗi "YYYY-MM-DD" (study_date). */

const DAY_MS = 86_400_000;

function toDay(s: string): number {
  return Date.parse(`${s}T00:00:00Z`) / DAY_MS;
}

/** Tổng số study_date khác nhau. */
export function totalDays(studyDates: readonly string[]): number {
  return new Set(studyDates).size;
}

/**
 * Chuỗi: hôm nay có học thì đếm lùi từ hôm nay; chưa học nhưng hôm qua có thì đếm lùi
 * từ hôm qua; còn lại 0. Ngày sau `today` bị bỏ qua.
 */
export function computeStreak(studyDates: readonly string[], today: string): number {
  const days = new Set<number>();
  const t = toDay(today);
  for (const s of studyDates) {
    const d = toDay(s);
    if (d <= t) days.add(d);
  }
  let cursor = days.has(t) ? t : t - 1;
  let n = 0;
  while (days.has(cursor)) {
    n++;
    cursor--;
  }
  return n;
}
