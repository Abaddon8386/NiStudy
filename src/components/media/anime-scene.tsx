/**
 * Tranh "phong cách anime" vẽ bằng SVG: trời hoàng hôn, núi Phú Sĩ, mây trôi ba lớp, mặt hồ, cổng
 * torii đỏ, cây anh đào, đèn đá. Sắc nét ở mọi độ phân giải, không tải ảnh. Chuyển động (mây, trời đổi
 * màu, mặt nước lấp lánh) chỉ chạy bằng CSS khi khung cha có `data-live` (xem auth-backdrop.css);
 * không JS hoặc reduced-motion: tranh tĩnh. Trang trí thuần túy: cha đặt `aria-hidden`.
 * Tọa độ theo viewBox 1600×900; tâm bố cục (núi) ở x≈620 để chừa chỗ cho thẻ form bên phải.
 */
const FUJI =
  "M-30 652 C 170 610 330 540 450 460 C 520 412 562 360 590 318 L 604 304 L 618 310 L 632 302 L 648 314 C 676 356 720 410 790 458 C 910 540 1070 610 1270 652 Z";
const SNOW =
  "M590 318 L604 304 L618 310 L632 302 L648 314 C 664 338 684 364 706 390 Q 694 386 684 396 Q 676 382 664 392 Q 654 410 642 398 Q 630 384 620 404 Q 608 420 598 400 Q 588 386 576 398 Q 566 406 556 396 Q 548 392 536 398 C 556 376 574 346 590 318 Z";

/** Số giả ngẫu nhiên có hạt giống: vẽ y hệt ở máy chủ và trình duyệt. */
function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="120" ry="26" />
      <ellipse cx="-50" cy="-14" rx="56" ry="28" />
      <ellipse cx="30" cy="-22" rx="64" ry="34" />
      <ellipse cx="90" cy="-8" rx="46" ry="22" />
    </g>
  );
}

/** Hai bản mây cách nhau đúng 1600 đơn vị: dịch -1600 rồi lặp là liền mạch. */
function CloudBand({ items, className, fill }: { items: [number, number, number][]; className: string; fill: string }) {
  const one = items.map(([x, y, s], i) => <Cloud key={i} x={x} y={y} s={s} />);
  return (
    <g className={className} fill={fill}>
      {one}
      <g transform="translate(1600 0)">{one}</g>
    </g>
  );
}

function Torii({ x, base, h }: { x: number; base: number; h: number }) {
  const w = h * 0.86;
  const left = x - w / 2;
  return (
    <g>
      {/* cột */}
      <rect x={left + w * 0.16} y={base - h * 0.86} width={h * 0.07} height={h * 0.86} fill="#c7352a" />
      <rect x={left + w * 0.84 - h * 0.07} y={base - h * 0.86} width={h * 0.07} height={h * 0.86} fill="#c7352a" />
      {/* bóng tối mặt khuất của cột */}
      <rect x={left + w * 0.16 + h * 0.045} y={base - h * 0.86} width={h * 0.025} height={h * 0.86} fill="#8f2219" />
      <rect x={left + w * 0.84 - h * 0.025} y={base - h * 0.86} width={h * 0.025} height={h * 0.86} fill="#8f2219" />
      {/* xà dưới (nuki) */}
      <rect x={left + w * 0.08} y={base - h * 0.7} width={w * 0.84} height={h * 0.055} fill="#d13b2e" />
      {/* biển giữa */}
      <rect x={x - h * 0.05} y={base - h * 0.86} width={h * 0.1} height={h * 0.16} fill="#1f201d" />
      {/* xà trên (kasagi) cong, mái đen */}
      <path
        d={`M${left - w * 0.06} ${base - h * 0.9} Q ${x} ${base - h * 0.84} ${left + w * 1.06} ${base - h * 0.9} L ${left + w * 1.02} ${base - h * 0.84} Q ${x} ${base - h * 0.79} ${left - w * 0.02} ${base - h * 0.84} Z`}
        fill="#d13b2e"
      />
      <path
        d={`M${left - w * 0.1} ${base - h * 0.96} Q ${x} ${base - h * 0.88} ${left + w * 1.1} ${base - h * 0.96} L ${left + w * 1.06} ${base - h * 0.9} Q ${x} ${base - h * 0.845} ${left - w * 0.06} ${base - h * 0.9} Z`}
        fill="#1f201d"
      />
    </g>
  );
}

function Blossoms({ cx, cy, rx, ry, seed }: { cx: number; cy: number; rx: number; ry: number; seed: number }) {
  const r = rng(seed);
  const shade = ["#d9809d", "#e48fab"];
  const mid = ["#f4a3ba", "#f7b6c8", "#ee9ab2"];
  const light = ["#fbd0dc", "#ffe0e8", "#f9c4d3"];
  const dots = (n: number, pal: string[], size: [number, number], lift: number) =>
    Array.from({ length: n }, () => {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r());
      return {
        x: cx + Math.cos(a) * rx * d,
        y: cy + Math.sin(a) * ry * d - lift,
        rad: size[0] + r() * (size[1] - size[0]),
        c: pal[Math.floor(r() * pal.length)],
      };
    });
  const layers = [dots(26, shade, [26, 40], -14), dots(40, mid, [20, 34], 0), dots(34, light, [12, 24], 16)];
  return (
    <g>
      {layers.flat().map((d, i) => (
        <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.rad.toFixed(1)} fill={d.c} />
      ))}
    </g>
  );
}

export function AnimeScene() {
  return (
    <svg className="bd-art-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" focusable="false">
      <defs>
        <linearGradient id="bd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2350" />
          <stop offset="0.34" stopColor="#5a3f86" />
          <stop offset="0.56" stopColor="#c8607a" />
          <stop offset="0.68" stopColor="#f39a6b" />
          <stop offset="0.74" stopColor="#ffd27a" />
        </linearGradient>
        <linearGradient id="bd-sky-late" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f1438" />
          <stop offset="0.4" stopColor="#2f2a66" />
          <stop offset="0.62" stopColor="#8a4a7a" />
          <stop offset="0.74" stopColor="#e07a5f" />
        </linearGradient>
        <radialGradient id="bd-sun-glow">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#ffd84a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffd84a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bd-fuji" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2d2e5e" />
          <stop offset="0.48" stopColor="#3b3b72" />
          <stop offset="0.52" stopColor="#4b4683" />
          <stop offset="1" stopColor="#5b5190" />
        </linearGradient>
        <linearGradient id="bd-snow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9d3ef" />
          <stop offset="0.5" stopColor="#f3eef9" />
          <stop offset="1" stopColor="#ffd9c4" />
        </linearGradient>
        <linearGradient id="bd-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b4f86" />
          <stop offset="0.25" stopColor="#3a336a" />
          <stop offset="1" stopColor="#141633" />
        </linearGradient>
        <linearGradient id="bd-reflect" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <mask id="bd-reflect-mask">
          <rect x="0" y="650" width="1600" height="250" fill="url(#bd-reflect)" />
        </mask>
      </defs>

      {/* Trời: lớp chiều + lớp tối dần (đổi độ đục chậm khi chạy) */}
      <rect width="1600" height="900" fill="url(#bd-sky)" />
      <rect className="bd-sky-late" width="1600" height="900" fill="url(#bd-sky-late)" opacity="0" />

      {/* Sao */}
      <g className="bd-stars" fill="#fff8e1">
        {[
          [120, 70, 2],
          [260, 140, 1.5],
          [420, 60, 2.2],
          [700, 110, 1.4],
          [930, 50, 2],
          [1120, 120, 1.6],
          [1300, 70, 2.2],
          [1480, 150, 1.5],
          [1010, 200, 1.2],
          [560, 190, 1.3],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>

      {/* Mặt trời lặn */}
      <circle cx="1010" cy="470" r="280" fill="url(#bd-sun-glow)" />
      <circle cx="1010" cy="470" r="54" fill="#ffd84a" />
      <circle cx="1010" cy="470" r="54" fill="#fff1b8" opacity="0.35" />

      {/* Mây xa */}
      <CloudBand
        className="bd-cloud bd-cloud-far"
        fill="#f6b38e"
        items={[
          [150, 230, 0.7],
          [560, 170, 0.55],
          [980, 250, 0.75],
          [1380, 200, 0.6],
        ]}
      />

      {/* Dãy núi xa */}
      <path d="M0 610 L120 560 L260 590 L400 540 L520 585 L760 600 L900 560 L1060 590 L1200 545 L1360 585 L1600 550 L1600 660 L0 660 Z" fill="#6c4f8c" opacity="0.85" />

      {/* Núi Phú Sĩ */}
      <path d={FUJI} fill="url(#bd-fuji)" />
      <path d={SNOW} fill="url(#bd-snow)" />
      {/* nắng chiều viền sườn phải */}
      <path d="M648 314 C 676 356 720 410 790 458 C 910 540 1070 610 1270 652 L 1230 652 C 1060 612 900 545 780 466 C 714 418 672 360 648 314 Z" fill="#f39a6b" opacity="0.3" />

      {/* Mây gần, trôi nhanh hơn */}
      <CloudBand
        className="bd-cloud bd-cloud-mid"
        fill="#ffcfb0"
        items={[
          [260, 430, 0.85],
          [1060, 360, 0.95],
          [1480, 440, 0.7],
        ]}
      />

      {/* Rừng ven hồ */}
      <path
        d="M-10 652 Q 20 628 50 640 Q 80 620 110 636 Q 150 618 190 640 Q 240 630 280 646 L 980 650 Q 1010 630 1040 642 Q 1080 622 1120 640 Q 1170 626 1210 644 Q 1260 630 1300 646 Q 1360 628 1420 644 Q 1480 630 1540 642 Q 1580 634 1610 646 L 1610 660 L -10 660 Z"
        fill="#2a2347"
      />
      {/* Hồ */}
      <rect x="0" y="648" width="1600" height="252" fill="url(#bd-lake)" />
      {/* Bóng núi dưới nước */}
      <g mask="url(#bd-reflect-mask)" opacity="0.55">
        <path d={FUJI} transform="translate(0 1298) scale(1 -1)" fill="#4b4683" />
        <path d={SNOW} transform="translate(0 1298) scale(1 -1)" fill="#e9e2f6" />
      </g>
      {/* Vệt nắng lấp lánh */}
      <g className="bd-shimmer" fill="#ffd84a">
        <rect x="840" y="672" width="120" height="4" rx="2" opacity="0.8" />
        <rect x="810" y="700" width="180" height="4" rx="2" opacity="0.6" />
        <rect x="860" y="730" width="90" height="3" rx="1.5" opacity="0.7" />
        <rect x="790" y="764" width="220" height="4" rx="2" opacity="0.45" />
        <rect x="850" y="804" width="110" height="3" rx="1.5" opacity="0.5" />
      </g>

      {/* Cổng torii đứng trong nước + bóng */}
      <g transform="translate(0 0)">
        <Torii x={330} base={772} h={250} />
      </g>
      <g opacity="0.3" transform="translate(0 1546) scale(1 -1)">
        <Torii x={330} base={772} h={250} />
      </g>

      {/* Bờ trái: đồi tối + cây anh đào */}
      <path d="M-20 900 L-20 690 C 60 676 140 690 210 720 C 260 742 300 790 320 900 Z" fill="#1a1530" />
      <path d="M60 720 C 70 640 92 560 118 470" stroke="#2a1d2c" strokeWidth="18" fill="none" strokeLinecap="round" />
      <path d="M104 520 C 150 490 200 470 250 468" stroke="#2a1d2c" strokeWidth="9" fill="none" strokeLinecap="round" />
      <Blossoms cx={150} cy={440} rx={170} ry={110} seed={7} />

      {/* Bờ phải: đèn đá (tōrō) thắp sáng */}
      <path d="M1180 900 C 1240 800 1360 770 1620 760 L1620 900 Z" fill="#1a1530" />
      <g transform="translate(1440 700)">
        <circle cx="0" cy="22" r="70" fill="url(#bd-sun-glow)" />
        <rect x="-8" y="40" width="16" height="70" fill="#2b2433" />
        <rect x="-26" y="34" width="52" height="10" fill="#2b2433" />
        <rect x="-18" y="6" width="36" height="28" fill="#ffd84a" />
        <path d="M-36 8 L0 -16 L36 8 Z" fill="#2b2433" />
      </g>
    </svg>
  );
}
