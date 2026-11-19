/** Khoảng từ `from` đến `due` bằng chữ ngắn tiếng Việt: "10 phút", "3 ngày". */
export function formatInterval(from: Date, due: Date): string {
  const ms = Math.max(0, due.getTime() - from.getTime());
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "dưới 1 phút";
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.round(ms / 86_400_000);
  if (days < 30) return `${days} ngày`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} tháng`;
  return `${Math.round(days / 365)} năm`;
}
