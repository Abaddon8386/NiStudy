/** Vệt dạ quang: chuỗi dưới 2 ký tự (đếm theo ký tự hiển thị) chỉ vẽ gạch mỏng, không vệt dày. */
export function markVariant(text: string): "thick" | "thin" {
  return Array.from(text.trim().normalize("NFC")).length < 2 ? "thin" : "thick";
}
