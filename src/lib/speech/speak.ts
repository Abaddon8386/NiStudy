export interface SpeakOptions {
  /** Gọi khi phát xong, bị cắt (lượt khác thay thế) hoặc lỗi. */
  onEnd?: () => void;
}

interface Turn {
  id: number;
  onEnd?: () => void;
}

// Lượt đang phát (cấp module). Mỗi lượt chỉ gọi onEnd đúng một lần; sự kiện của lượt cũ đến muộn
// (sau cancel) hoặc không bao giờ đến (Safari) không ảnh hưởng lượt mới.
let current: Turn | null = null;
let nextId = 0;

function finish(turn: Turn) {
  if (current?.id !== turn.id) return;
  current = null;
  turn.onEnd?.();
}

/**
 * Phát `text` bằng giọng đã chọn. Phải gọi ngay trong thao tác bấm/phím (iOS chặn phát tự động).
 * Lượt đang phát (nếu có) được báo kết thúc ngay (đồng bộ) rồi bị hủy. Không có speechSynthesis thì
 * không làm gì (và gọi onEnd).
 */
export function speak(text: string, voice: SpeechSynthesisVoice | null, options: SpeakOptions = {}): void {
  const synth = typeof window === "undefined" ? undefined : window.speechSynthesis;
  if (!synth || !text) {
    options.onEnd?.();
    return;
  }
  if (current) finish(current);
  const turn: Turn = { id: ++nextId, onEnd: options.onEnd };
  current = turn;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    if (voice) u.voice = voice;
    u.rate = 0.9;
    u.onend = () => finish(turn);
    u.onerror = () => finish(turn);
    synth.speak(u);
  } catch {
    finish(turn);
  }
}
