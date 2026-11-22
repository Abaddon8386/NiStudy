"use client";

import { useEffect, useRef } from "react";

interface Petal {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  phase: number;
  spin: number;
  angle: number;
  color: string;
}

const COLORS = ["#ffd6e0", "#ffc0d0", "#f7a8c0", "#ffe3ea"];

/** Tạo một cánh hoa ngẫu nhiên; `top` = bắt đầu trên mép trên khung. Hàm thuần để test được. */
export function makePetal(w: number, h: number, rand: () => number, top = false): Petal {
  return {
    x: rand() * w,
    y: top ? -20 - rand() * 60 : rand() * h,
    r: 5 + rand() * 6,
    vy: 22 + rand() * 30, // px/giây
    sway: 18 + rand() * 30,
    phase: rand() * Math.PI * 2,
    spin: (rand() - 0.5) * 2.4,
    angle: rand() * Math.PI,
    color: COLORS[Math.floor(rand() * COLORS.length)],
  };
}

/** Dịch cánh hoa `dt` giây; ra khỏi đáy thì sinh lại trên đỉnh. */
export function stepPetal(p: Petal, dt: number, w: number, h: number, rand: () => number): Petal {
  const next = { ...p, y: p.y + p.vy * dt, phase: p.phase + dt * 1.3, angle: p.angle + p.spin * dt };
  if (next.y > h + 20) return makePetal(w, h, rand, true);
  return next;
}

/**
 * Cánh hoa anh đào rơi trên Canvas 2D. Chỉ vẽ khi `running`; dừng hẳn vòng rAF khi không chạy
 * (tab ẩn, bấm tạm dừng, cảnh khác đang hiện). Số hạt vừa phải: 16 trên màn hẹp, 34 trên máy tính.
 */
export function Petals({ running }: { running: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const petals = useRef<Petal[]>([]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 768 ? 16 : 34;
      if (petals.current.length !== n) petals.current = Array.from({ length: n }, () => makePetal(w, h, Math.random));
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);
      petals.current = petals.current.map((p) => stepPetal(p, dt, w, h, Math.random));
      for (const p of petals.current) {
        ctx.save();
        ctx.translate(p.x + Math.sin(p.phase) * p.sway, p.y);
        ctx.rotate(p.angle);
        ctx.scale(1, 0.45 + 0.4 * Math.abs(Math.cos(p.phase * 1.7))); // lật nhẹ như cánh hoa xoay
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    if (running) raf = requestAnimationFrame((t) => {
      last = t;
      draw(t);
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [running]);

  return <canvas ref={ref} className="bd-petals" data-running={running ? "" : undefined} />;
}
