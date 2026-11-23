"use client";

import { useEffect, useRef, useState } from "react";
import { speak, useJapaneseVoice } from "@/lib/speech";

/**
 * Nút tròn biểu tượng loa phát `text` bằng giọng tiếng Nhật của thiết bị (FR-C1).
 * Không có giọng (hoặc trình duyệt không hỗ trợ) thì không hiện gì (FR-C2). Vùng bấm 44px.
 * `label` là chữ hiển thị cho tên nút, mặc định lấy `text`.
 */
export function SpeakButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const { status, voice } = useJapaneseVoice();
  const [playing, setPlaying] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  if (status !== "ready") return null;

  return (
    <button
      type="button"
      aria-label={`Phát âm: ${label ?? text}`}
      aria-pressed={playing}
      onClick={() => {
        setPlaying(true);
        speak(text, voice, {
          onEnd: () => {
            if (alive.current) setPlaying(false);
          },
        });
      }}
      className={`ui-speak press inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink text-ink ${
        playing ? "bg-marker" : "bg-paper hover:bg-sand"
      } ${className ?? ""}`.trim()}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor" />
        <path className="ui-speak-wave" d="M15.5 9a4 4 0 0 1 0 6" />
        <path className="ui-speak-wave" d="M18 6.5a7.5 7.5 0 0 1 0 11" />
      </svg>
    </button>
  );
}
