/**
 * Ngày học (FR-09): ranh giới 04:00 giờ địa phương theo múi giờ IANA.
 * Hàm thuần: thời điểm và múi giờ là tham số, không đọc đồng hồ hệ thống.
 */

const BOUNDARY_HOUR = 4;

interface LocalParts {
  year: number;
  month: number; // 1..12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function localParts(instant: Date, timeZone: string): LocalParts {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, fmt);
  }
  const out: Record<string, number> = {};
  for (const p of fmt.formatToParts(instant)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour,
    minute: out.minute,
    second: out.second,
  };
}

/** Chênh lệch (ms) giữa giờ địa phương và UTC tại thời điểm `instant`. */
function offsetMs(instant: Date, timeZone: string): number {
  const p = localParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

/** Ngày học (YYYY-MM-DD) chứa thời điểm `now`. 03:59 thuộc hôm trước, 04:00 thuộc hôm nay. */
export function studyDate(now: Date, timeZone: string): string {
  const p = localParts(now, timeZone);
  // Lùi 4 giờ theo giờ địa phương rồi lấy ngày: Date.UTC tự xử lý qua tháng/năm.
  const shifted = new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour - BOUNDARY_HOUR));
  return `${pad(shifted.getUTCFullYear(), 4)}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** Thời điểm 04:00 kế tiếp theo giờ địa phương (kết thúc ngày học hiện tại), trả về UTC. */
export function dayEnd(now: Date, timeZone: string): Date {
  const [y, m, d] = studyDate(now, timeZone).split("-").map(Number);
  // 04:00 ngày kế tiếp (giờ địa phương) dưới dạng "giờ treo" UTC.
  const wall = Date.UTC(y, m - 1, d + 1, BOUNDARY_HOUR);
  let utc = wall - offsetMs(new Date(wall), timeZone);
  // Điều chỉnh lần hai nếu độ lệch khác nhau giữa hai thời điểm (đổi giờ mùa hè).
  utc = wall - offsetMs(new Date(utc), timeZone);
  return new Date(utc);
}
