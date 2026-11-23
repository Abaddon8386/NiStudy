export interface SpeakOptions {
  /** Gọi khi phát xong, bị cắt (lượt khác thay thế) hoặc lỗi. */
  onEnd?: () => void;
}

/**
 * Phát `text` bằng giọng đã chọn. Phải gọi ngay trong thao tác bấm/phím (iOS chặn phát tự động).
 * Hủy lượt đang phát trước khi bắt đầu. Không có speechSynthesis thì không làm gì (và gọi onEnd).
 */
export function speak(text: string, voice: SpeechSynthesisVoice | null, options: SpeakOptions = {}): void {
  const synth = typeof window === "undefined" ? undefined : window.speechSynthesis;
  if (!synth || !text) {
    options.onEnd?.();
    return;
  }
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    if (voice) u.voice = voice;
    u.rate = 0.9;
    u.onend = () => options.onEnd?.();
    u.onerror = () => options.onEnd?.();
    synth.speak(u);
  } catch {
    options.onEnd?.();
  }
}
