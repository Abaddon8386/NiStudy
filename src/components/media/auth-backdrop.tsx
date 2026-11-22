"use client";

import { useEffect, useRef, useState } from "react";
import { isLowPower, prefersReducedMotion } from "@/ui/motion/env";
import { AnimeScene } from "./anime-scene";
import { Petals } from "./petals";
import "./auth-backdrop.css";

export type BackdropScene =
  | { kind: "art"; ja: string; name: string; vi: string }
  | { kind: "video"; poster: string; mp4: string; webm: string; ja: string; name: string; vi: string };

export const HOLD_MS = 10_000;
const ARM_AFTER_MS = 3_000;

/** Được tải clip không: máy tính ≥1024px, không bật tiết kiệm dữ liệu, không phải máy yếu. */
function canLoadVideo(): boolean {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return matchMedia("(min-width: 1024px)").matches && !conn?.saveData && !isLowPower();
}

/** Cảnh kế tiếp cần nạp trước khi đến lượt (để crossfade không lộ khung trống). */
export function nextIndex(i: number, n: number): number {
  return (i + 1) % n;
}

/**
 * Nền toàn trang cho màn auth: phủ kín viewport (fixed), chuỗi cảnh luân phiên crossfade 1,5s, mỗi
 * cảnh 10s. Cảnh 0 là tranh vẽ (SVG + cánh hoa Canvas) có sẵn trong HTML nên hiện ngay. Clip chỉ gắn
 * vào DOM trên máy tính, sau khi trang tải xong; mỗi clip chỉ có nguồn (và poster) khi sắp đến lượt.
 * Reduced-motion, máy yếu, không JS: tranh tĩnh, không clip, không hạt rơi, không nút.
 * Tab ẩn hoặc bấm nút tạm dừng: dừng chuỗi, clip, mây và cánh hoa.
 */
export function AuthBackdrop({ scenes }: { scenes: BackdropScene[] }) {
  const [live, setLive] = useState(false);
  const [list, setList] = useState<BackdropScene[]>(() => scenes.slice(0, 1));
  const [index, setIndex] = useState(0);
  // Clip có chỉ số ≤ armedTo đã được gắn nguồn (cảnh đang hiện hoặc sắp đến lượt).
  const [armedTo, setArmedTo] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const shownAt = useRef(-1);

  // Bật sau khi trang tải xong và rảnh: không tranh băng thông/CPU với form.
  useEffect(() => {
    if (prefersReducedMotion() || isLowPower()) return;
    let idle = 0;
    const start = () => {
      const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
      idle = ric(() => {
        setList(canLoadVideo() ? scenes : scenes.filter((s) => s.kind === "art").slice(0, 1));
        setLive(true);
      }) as number;
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      (window.cancelIdleCallback ?? window.clearTimeout)(idle);
    };
  }, [scenes]);

  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const running = live && !paused && !hidden;

  useEffect(() => {
    if (!running || list.length < 2) return;
    const next = nextIndex(index, list.length);
    // Nạp clip của cảnh kế tiếp khi cảnh hiện tại đã hiện được 3 giây (không tranh băng thông lúc mở trang).
    const arm = window.setTimeout(() => setArmedTo((a) => Math.max(a, next)), ARM_AFTER_MS);
    const t = window.setTimeout(() => setIndex(next), HOLD_MS);
    return () => {
      window.clearTimeout(arm);
      window.clearTimeout(t);
    };
  }, [running, index, list.length]);

  // Chỉ clip đang hiện được phát; vừa đến lượt thì phát từ đầu.
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (running && i === index) {
        if (shownAt.current !== i) v.currentTime = 0;
        v.play().catch(() => {});
      } else v.pause();
    });
    shownAt.current = index;
  }, [running, index, armedTo]);

  const s = list[index] ?? list[0];
  return (
    <>
      <div className="bd" data-live={live ? "" : undefined} data-paused={running ? undefined : ""} aria-hidden="true">
        {list.map((sc, i) => {
          const armed = live && i <= armedTo;
          return (
            <div key={i} className="bd-layer" data-active={i === index ? "" : undefined} data-kind={sc.kind}>
              {sc.kind === "art" ? (
                <>
                  <AnimeScene />
                  {live ? <Petals running={running && i === index} /> : null}
                </>
              ) : (
                <video
                  ref={(el) => {
                    videos.current[i] = el;
                  }}
                  className="bd-video"
                  muted
                  loop
                  playsInline
                  disablePictureInPicture
                  preload={armed ? "auto" : "none"}
                  poster={armed ? sc.poster : undefined}
                  tabIndex={-1}
                >
                  {armed ? (
                    <>
                      <source src={sc.webm} type="video/webm" />
                      <source src={sc.mp4} type="video/mp4" />
                    </>
                  ) : null}
                </video>
              )}
            </div>
          );
        })}
      </div>
      <div className="bd-meta">
        <p className="bd-caption">
          {s.kind === "art" ? (
            <>
              <span>{s.name}</span>
              <span aria-hidden="true"> · </span>
              <span lang="ja" className="font-jp">
                {s.ja}
              </span>
            </>
          ) : (
            <>
              <span lang="ja" className="font-jp">
                {s.ja}
              </span>
              <span aria-hidden="true"> · </span>
              <span>{s.name}</span>
            </>
          )}
          <span aria-hidden="true"> · </span>
          <span>{s.vi}</span>
        </p>
        {live ? (
          <button
            type="button"
            className="bd-btn press"
            aria-pressed={paused}
            aria-label={paused ? "Phát nền chuyển động" : "Tạm dừng nền chuyển động"}
            onClick={() => setPaused((p) => !p)}
          >
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
              {paused ? <path d="M6 4 L16 10 L6 16 Z" fill="currentColor" /> : <path d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z" fill="currentColor" />}
            </svg>
          </button>
        ) : null}
      </div>
    </>
  );
}
