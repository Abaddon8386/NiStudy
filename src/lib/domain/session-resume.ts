import { isFinished, type SessionState } from "./session";

/** Snapshot phiên ôn lưu trên thiết bị (FR-28), gắn với một người dùng và một ngày học. */
export interface SessionSnapshot {
  userId: string;
  sessionId: string;
  studyDate: string;
  state: SessionState;
}

/**
 * Có tiếp tục phiên đã lưu không: cùng tài khoản, cùng ngày học, còn thẻ chưa ôn (FR-28).
 * Dữ liệu IndexedDB không đáng tin tuyệt đối nên kiểm hình dạng tối thiểu.
 */
export function canResume(
  snap: SessionSnapshot | null | undefined,
  userId: string,
  today: string,
): snap is SessionSnapshot {
  if (!snap || snap.userId !== userId || snap.studyDate !== today) return false;
  const s = snap.state;
  if (!s || !Array.isArray(s.cards) || !Array.isArray(s.results) || typeof s.index !== "number") return false;
  return s.cards.length > 0 && !isFinished(s);
}
