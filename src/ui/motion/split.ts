/** Tách chuỗi thành các TỪ (theo khoảng trắng), chuẩn hóa NFC để dấu tiếng Việt không bị rời. */
export function splitWords(text: string): string[] {
  return text.normalize("NFC").split(/\s+/).filter(Boolean);
}
