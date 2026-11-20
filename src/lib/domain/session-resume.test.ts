import { describe, expect, it } from "vitest";
import type { SessionCard } from "./queue";
import { startSession, type SessionState } from "./session";
import { canResume, type SessionSnapshot } from "./session-resume";

const card = (id: string): SessionCard => ({
  card: { id, kind: "kana", level: null }, details: null, state: null, isNew: true,
});
const snap = (over: Partial<SessionSnapshot> = {}, state: SessionState = startSession([card("a"), card("b")])): SessionSnapshot => ({
  userId: "u1", sessionId: "s1", studyDate: "2026-11-20", state, ...over,
});

describe("canResume (FR-28)", () => {
  it("cùng người dùng, cùng ngày học, chưa xong: tiếp tục", () => {
    expect(canResume(snap(), "u1", "2026-11-20")).toBe(true);
    expect(canResume(snap({}, { ...startSession([card("a"), card("b")]), index: 1 }), "u1", "2026-11-20")).toBe(true);
  });

  it("khác người dùng hoặc khác ngày học: không", () => {
    expect(canResume(snap(), "u2", "2026-11-20")).toBe(false);
    expect(canResume(snap(), "u1", "2026-11-21")).toBe(false);
  });

  it("đã xong, không có thẻ, thiếu snapshot hoặc hỏng: không", () => {
    expect(canResume(snap({}, { ...startSession([card("a")]), index: 1 }), "u1", "2026-11-20")).toBe(false);
    expect(canResume(snap({}, startSession([])), "u1", "2026-11-20")).toBe(false);
    expect(canResume(null, "u1", "2026-11-20")).toBe(false);
    expect(canResume(undefined, "u1", "2026-11-20")).toBe(false);
    expect(canResume({ userId: "u1", studyDate: "2026-11-20" } as unknown as SessionSnapshot, "u1", "2026-11-20")).toBe(false);
  });
});
