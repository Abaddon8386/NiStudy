"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { isLowPower, prefersReducedMotion } from "@/ui/motion/env";
import "./scene-show.css";

export interface Scene {
  kind: "image" | "video";
  /** Ảnh (hoặc poster của video). */
  src: string;
  width: number;
  height: number;
  /** Chỉ với video: tệp MP4. */
  video?: string;
  /** Chú thích: chữ Nhật, tên La-tinh, nghĩa tiếng Việt. */
  ja: string;
  name: string;
  vi: string;
}

const HOLD_MS = 8000;

/**
 * Chuỗi cảnh Nhật Bản luân phiên: crossfade 1,2s + Ken Burns chậm. Cảnh đầu nạp ưu tiên; các cảnh
 * sau chỉ gắn vào DOM khi trang đã tải xong và được phép chuyển động. Reduced-motion, máy yếu,
 * không JS: chỉ cảnh đầu, đứng yên, không video. Tab ẩn hoặc bấm "Dừng": dừng cả chuỗi lẫn video.
 * Ảnh là trang trí (`alt=""`); chú thích là văn bản thật.
 */
export function SceneShow({
  scenes,
  sizes,
  className,
  controls = true,
}: {
  scenes: Scene[];
  sizes: string;
  className?: string;
  /** false: không vẽ nút Dừng (khung nhỏ, chuỗi tự dừng sau một vòng). */
  controls?: boolean;
}) {
  const [live, setLive] = useState(false);
  // Màn hẹp: chỉ ảnh (không video, tiết kiệm dữ liệu), tối đa 4 cảnh. Cảnh đầu luôn là ảnh.
  const [list, setList] = useState(scenes);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  // Chỉ bật chuỗi sau khi trang tải xong (không tranh băng thông với ảnh đầu và form).
  useEffect(() => {
    if (prefersReducedMotion() || isLowPower() || scenes.length < 2) return;
    let idle = 0;
    const start = () => {
      const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
      idle = ric(() => {
        if (!matchMedia("(min-width: 1024px)").matches) {
          setList(scenes.filter((x) => x.kind === "image").slice(0, 4));
        }
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
  const ranOnce = !controls && index === list.length - 1;

  useEffect(() => {
    if (!running || ranOnce) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % list.length), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [running, index, list.length, ranOnce]);

  // Chỉ video của cảnh đang hiện được phát.
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (running && i === index) v.play().catch(() => {});
      else v.pause();
    });
  }, [running, index]);

  const s = list[index] ?? list[0];
  return (
    <figure className={`ss ${className ?? ""}`} data-live={live ? "" : undefined} data-paused={running ? undefined : ""}>
      <div className="ss-stage" aria-hidden="true">
        {list.map((sc, i) =>
          i === 0 || live ? (
            <div key={sc.src} className="ss-slide" data-active={i === index ? "" : undefined}>
              <Image
                src={sc.src}
                alt=""
                fill
                sizes={sizes}
                preload={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                className="ss-media"
              />
              {sc.kind === "video" && live ? (
                <video
                  ref={(el) => {
                    videos.current[i] = el;
                  }}
                  className="ss-media ss-video"
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster={sc.src}
                  tabIndex={-1}
                >
                  <source src={sc.video} type="video/mp4" />
                </video>
              ) : null}
            </div>
          ) : null,
        )}
        <div className="ss-scrim" />
      </div>
      <figcaption className="ss-caption">
        <span lang="ja" className="font-jp">
          {s.ja}
        </span>
        <span aria-hidden="true"> · </span>
        <span>{s.name}</span>
        <span aria-hidden="true"> · </span>
        <span>{s.vi}</span>
      </figcaption>
      {controls && live ? (
        <button
          type="button"
          className="ss-btn press"
          aria-pressed={paused}
          aria-label={paused ? "Phát chuyển cảnh" : "Dừng chuyển cảnh"}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "Phát" : "Dừng"}
        </button>
      ) : null}
    </figure>
  );
}
