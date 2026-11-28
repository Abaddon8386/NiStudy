"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadDashboard } from "@/lib/learning/dashboard";
import { usePendingCount } from "@/lib/learning/outbox";
import {
  buildDashboardView,
  shouldStamp,
  studyGrid,
  type DashboardData,
  type DashboardView,
} from "@/lib/domain/dashboard-view";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Mark } from "@/ui/Mark";
import { Notice } from "@/ui/Notice";
import { CountUp } from "@/ui/motion/CountUp";
import { Reveal } from "@/ui/motion/Reveal";
import { useInView } from "@/ui/motion/use-in-view";
import "./dashboard.css";

interface Loaded {
  data: DashboardData;
  today: string;
  /** Dấu triện hôm nay đóng lần đầu trong ngày (vừa học xong). */
  fresh: boolean;
}

const STAMP_KEY = "nihongo:home-stamped";
const nf = new Intl.NumberFormat("vi-VN");
// Độ nghiêng của từng dấu triện (cố định theo vị trí để không nhảy giữa các lần vẽ).
const ROTS = [-8, 5, -3, 9, -6, 2, 7, -10, 4, -2, 8, -5, 3, -9, 6, -4, 10, -1];

function readStamped(): string | null {
  try {
    return localStorage.getItem(STAMP_KEY);
  } catch {
    return null;
  }
}
function writeStamped(today: string) {
  try {
    localStorage.setItem(STAMP_KEY, today);
  } catch {
    /* không lưu được thì lần sau đóng lại, không sao */
  }
}

function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "UTC", ...opts }).format(new Date(`${iso}T00:00:00Z`));
}

function accessibleHeadline(v: DashboardView): string {
  if (v.done) return "Hôm nay đã xong";
  return `Hôm nay: ${v.total} thẻ, khoảng ${v.minutes} phút`;
}

/** H1 hai dòng; trình đọc màn hình nghe một câu liền (bản sr-only). */
function Headline({ view }: { view: DashboardView | null }) {
  const cls = "text-[28px] leading-[1.15] min-[400px]:text-[32px] font-extrabold tracking-[-0.5px] lg:text-[48px] lg:leading-[1.1]";
  if (!view) return <h1 className={cls}>Hôm nay</h1>;
  return (
    <h1 className={cls}>
      <span className="sr-only">{accessibleHeadline(view)}</span>
      <span aria-hidden="true" className="dash-line block">
        Hôm nay
      </span>
      <span aria-hidden="true" className="dash-line block" style={{ "--i": 1 } as CSSProperties}>
        {view.done ? (
          <Mark>đã xong.</Mark>
        ) : (
          <>
            {nf.format(view.total)} thẻ, <Mark>{`khoảng ${view.minutes} phút.`}</Mark>
          </>
        )}
      </span>
    </h1>
  );
}

function Skeleton() {
  const bone = "rounded-[28px] bg-hair";
  return (
    <div aria-busy="true" aria-label="Đang tải số liệu" className="grid grid-cols-2 gap-4 lg:grid-cols-12 lg:gap-6">
      <div className={`${bone} col-span-2 h-[316px] lg:col-span-8 lg:h-[380px]`} />
      <div className={`${bone} col-span-2 h-[372px] lg:col-span-4 lg:h-[380px]`} />
      <div className="h-[132px] rounded-[22px] bg-hair lg:col-span-4 lg:h-[148px]" />
      <div className="h-[132px] rounded-[22px] bg-hair lg:col-span-4 lg:h-[148px]" />
      <div className="col-span-2 h-16 rounded-full bg-hair lg:col-span-4 lg:h-[148px] lg:rounded-[28px]" />
    </div>
  );
}

/** Thanh tiến độ thẻ mới: chạy từ 0 tới giá trị khi vào khung nhìn. */
function NewBar({ pct, done, goal }: { pct: number; done: number; goal: number }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label="Thẻ mới hôm nay"
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={Math.min(done, goal)}
      className="h-2.5 overflow-hidden rounded-full bg-track"
    >
      <div className="dash-bar h-full rounded-full bg-marker" style={{ width: `${inView ? pct : 0}%` }} />
    </div>
  );
}

function SealGlyph({ className, style, fresh }: { className: string; style?: CSSProperties; fresh?: boolean }) {
  return (
    <span
      aria-hidden="true"
      lang="ja"
      data-fresh={fresh ? "" : undefined}
      style={style}
      className={`dash-seal inline-flex items-center justify-center rounded-full bg-seal font-kanji font-semibold text-white shadow-[inset_0_0_0_2px_var(--seal-edge)] ${className}`}
    >
      学
    </span>
  );
}

function HeroDeco() {
  return (
    <>
      <span aria-hidden="true" className="dash-deco dash-waves" />
      {/* Chữ vẽ bằng ::before (không phải nút văn bản) để công cụ đo tương phản bỏ qua phần trang trí. */}
      <span aria-hidden="true" lang="ja" className="dash-deco dash-kanji font-kanji" />
    </>
  );
}

function Hero({ view, studiedToday, fresh }: { view: DashboardView; studiedToday: boolean; fresh: boolean }) {
  if (view.done) {
    return (
      <Reveal as="section" index={0} aria-label="Ôn hôm nay" className="col-span-2 lg:col-span-8">
        <Card tone="hero" className="dash-hero flex h-full flex-col gap-6 lg:flex-row lg:items-center lg:gap-10 lg:p-10">
          <HeroDeco />
          {studiedToday ? (
            <span
              aria-hidden="true"
              lang="ja"
              data-fresh={fresh ? "" : undefined}
              className="dash-seal-big inline-flex size-28 shrink-0 -rotate-8 items-center justify-center rounded-full bg-seal font-kanji text-[60px] font-semibold text-white shadow-[inset_0_0_0_4px_var(--seal-edge)] lg:size-40 lg:text-[84px]"
            >
              学
            </span>
          ) : (
            <p className="text-[96px] leading-[0.95] font-extrabold tracking-[-2px] tabular-nums">0</p>
          )}
          <div>
            <p className="text-[28px] leading-[1.2] font-extrabold lg:text-[36px]">Xong rồi. Hẹn mai.</p>
            <p className="mt-2 text-base">Không còn thẻ nào cần ôn hôm nay.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/kana" variant="onHero" size="lg">
                Ôn thêm kana
              </Button>
            </div>
          </div>
        </Card>
      </Reveal>
    );
  }

  const p = view.newProgress;
  return (
    <Reveal as="section" index={0} aria-label="Ôn hôm nay" className="col-span-2 lg:col-span-8">
      <Card tone="hero" className="dash-hero flex h-full flex-col lg:p-10">
        <HeroDeco />
        <div className="flex items-center gap-4">
          <p className="text-[96px] leading-[0.9] font-extrabold tracking-[-2px] tabular-nums lg:text-[120px]">
            <CountUp value={view.dueToday} />
          </p>
          <p className="max-w-[7ch] text-[20px] leading-[1.25] font-medium lg:text-[24px]">thẻ đến hạn</p>
        </div>
        <p className="mt-3 text-[18px] font-bold tabular-nums">+ {nf.format(view.newRemaining)} thẻ mới</p>
        <div className="mt-3 max-w-[440px]">
          <NewBar pct={p.pct} done={p.done} goal={p.goal} />
          <p className="mt-2 text-base tabular-nums">
            {nf.format(p.done)} / {nf.format(p.goal)} thẻ mới
          </p>
        </div>
        <div className="mt-6 lg:mt-auto lg:pt-8">
          <Button href="/on-tap" variant="onHero" size="lg" className="w-full lg:w-auto lg:min-w-[280px]">
            Bắt đầu ôn
          </Button>
        </div>
      </Card>
    </Reveal>
  );
}

function StudyDays({ d, today, fresh }: { d: DashboardData; today: string; fresh: boolean }) {
  const grid = d.studyDays ? studyGrid(d.studyDays, today, d.studiedToday) : null;
  let s = 0;
  return (
    <Reveal as="section" index={1} aria-labelledby="blk-days" className="dash-days col-span-2 lg:col-span-4">
      <Card tone="outlined" className="flex h-full flex-col p-5 lg:p-6">
        <h2 id="blk-days" className="sr-only">
          Ngày học
        </h2>
        <p className="flex items-baseline gap-2">
          <span className="text-[56px] leading-none font-extrabold tracking-[-1px]">
            <CountUp value={d.totalDays} />
          </span>
          <span className="text-[20px]">ngày đã học</span>
        </p>
        <p className="mt-1 text-[14px] text-ink-2">
          {d.streak > 0 ? `Chuỗi ${nf.format(d.streak)} ngày` : "Bắt đầu chuỗi mới hôm nay"}
        </p>
        {grid && (
          <div
            role="img"
            aria-label={`Đã học ${grid.studied} trong 35 ngày gần nhất, hôm nay ${d.studiedToday ? "đã học" : "chưa học"}`}
            className="mt-5 grid grid-cols-7 gap-x-1.5 gap-y-2 lg:mt-auto lg:pt-5"
          >
            {grid.cells.map((c, i) => {
              if (!c.studied) {
                return (
                  <span
                    key={c.date}
                    aria-hidden="true"
                    className={`dash-cell ${c.today ? "dash-cell-today" : "dash-cell-empty"}`}
                  />
                );
              }
              const style = {
                transform: `rotate(${ROTS[i % ROTS.length]}deg)`,
                "--s": s++,
              } as CSSProperties;
              return (
                <span key={c.date} aria-hidden="true" className="dash-cell">
                  <SealGlyph
                    className="text-[15px] lg:text-[17px]"
                    style={style}
                    fresh={c.today && fresh}
                  />
                </span>
              );
            })}
          </div>
        )}
      </Card>
    </Reveal>
  );
}

function ExamTile({ view, d }: { view: DashboardView; d: DashboardData }) {
  const level = d.level;
  const exam = view.exam;
  const tile = "flex h-full flex-col justify-between tabular-nums lg:p-6";
  const label = "text-[14px] leading-[1.3] text-ink-2";
  const name = `Thi JLPT${level ? ` ${level}` : ""}`;
  if (!exam) {
    return (
      <Reveal index={2} className="lg:col-span-4">
        <Card tone="sand" className={tile}>
          <p className={label}>{name}</p>
          <Link
            href="/cai-dat"
            className="mt-2 inline-flex min-h-11 items-center text-[18px] leading-[1.25] font-bold underline decoration-2 underline-offset-4"
          >
            Đặt ngày thi để đếm ngược
          </Link>
        </Card>
      </Reveal>
    );
  }
  return (
    <Reveal as="section" index={2} aria-labelledby="blk-exam" className="lg:col-span-4">
      <Card tone="sand" className={tile}>
        <h2 id="blk-exam" className={label}>
          {exam.kind === "days" ? `${name} còn` : name}
        </h2>
        {exam.kind === "days" && (
          <>
            <p className="text-[40px] leading-[1.15] font-extrabold">
              <CountUp value={exam.days} />
              <small className="ml-1.5 text-base font-normal">ngày</small>
            </p>
            <p className={label}>{fmtDate(d.examDate ?? "", { day: "numeric", month: "numeric", year: "numeric" })}</p>
          </>
        )}
        {exam.kind === "today" && <p className="text-[32px] leading-[1.15] font-extrabold">Hôm nay thi</p>}
        {exam.kind === "past" && (
          <p className="text-base">
            Ngày thi đã qua.{" "}
            <Link href="/cai-dat" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
              Đặt ngày mới trong Cài đặt
            </Link>
          </p>
        )}
      </Card>
    </Reveal>
  );
}

function XpTile({ d }: { d: DashboardData }) {
  return (
    <Reveal as="section" index={3} aria-labelledby="blk-xp" className="lg:col-span-4">
      <Card tone="sand" className="flex h-full flex-col justify-between tabular-nums lg:p-6">
        <h2 id="blk-xp" className="text-[14px] leading-[1.3] text-ink-2">
          Điểm XP
        </h2>
        <p className="text-[40px] leading-[1.15] font-extrabold">
          <CountUp value={d.xpTotal} />
        </p>
        <p className="text-[14px] leading-[1.3] text-ink-2">hôm nay +{nf.format(d.xpToday)}</p>
      </Card>
    </Reveal>
  );
}

function QuizEntry() {
  return (
    <Reveal index={4} className="col-span-2 lg:col-span-4">
      <Link
        href="/trac-nghiem"
        className="dash-quiz flex min-h-16 w-full items-center justify-between gap-4 rounded-full border-2 border-ink bg-paper px-6 text-[18px] font-bold lg:h-full lg:flex-col lg:items-start lg:rounded-[28px] lg:p-6"
      >
        <span>Trắc nghiệm · 10 câu</span>
        <span aria-hidden="true" className="text-[24px] leading-none lg:self-end lg:text-[32px]">
          →
        </span>
      </Link>
    </Reveal>
  );
}

function GrammarEntry() {
  return (
    <Reveal index={5} className="col-span-2 lg:col-span-12">
      <Link
        href="/ngu-phap"
        className="dash-quiz flex min-h-16 w-full items-center justify-between gap-4 rounded-full border-2 border-ink bg-paper px-6 text-[18px] font-bold"
      >
        <span>Ngữ pháp N5</span>
        <span aria-hidden="true" className="text-[24px] leading-none">
          →
        </span>
      </Link>
    </Reveal>
  );
}

export function Dashboard() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const pending = usePendingCount();
  const seq = useRef(0);
  const hasData = useRef(false);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  // Mở lại cửa sổ/tab: tải lại để thấy lượt ôn vừa chấm (US-10).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") retry();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [retry]);

  // Chỉ tải khi hàng chờ rỗng; hàng chờ về rỗng cũng kích hoạt tải lại.
  useEffect(() => {
    if (pending > 0) return;
    const id = ++seq.current;
    void loadDashboard().then((r) => {
      if (id !== seq.current) return;
      if (r.ok) {
        hasData.current = true;
        const fresh = shouldStamp(r.data.studiedToday, r.today, readStamped());
        if (fresh) writeStamped(r.today);
        setLoaded((prev) => ({
          data: r.data,
          today: r.today,
          // Giữ hiệu ứng nếu lần tải trước của cùng ngày đã bật (tránh tắt giữa chừng khi tải lại nhanh).
          fresh: fresh || (prev?.today === r.today && prev.fresh),
        }));
        setFailed(false);
      } else if (!hasData.current) {
        setFailed(true);
      }
    });
  }, [pending, reloadKey]);

  const view = loaded ? buildDashboardView(loaded.data, loaded.today) : null;
  const d = loaded?.data;

  return (
    <main id="noi-dung" tabIndex={-1} className="dash flex flex-col gap-6 px-4 py-6 lg:gap-8 lg:px-8 lg:py-10">
      <header>
        <Headline key={view ? accessibleHeadline(view) : "loading"} view={view} />
        {loaded && (
          <p className="mt-2 text-base text-ink-2 first-letter:uppercase">
            {fmtDate(loaded.today, { weekday: "long", day: "numeric", month: "numeric", year: "numeric" })}
          </p>
        )}
        {pending > 0 && (
          <Notice tone="info" className="mt-3 w-fit py-2 text-[14px] tabular-nums">
            Đang đồng bộ {nf.format(pending)} lượt ôn
          </Notice>
        )}
      </header>

      {!loaded && !failed && <Skeleton />}

      {!loaded && failed && (
        <div className="flex flex-col gap-4">
          <Notice tone="error">Chưa tải được số liệu. Bạn vẫn có thể bắt đầu ôn.</Notice>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={retry}>
              Thử lại
            </Button>
            <Button href="/on-tap" variant="primary">
              Bắt đầu ôn
            </Button>
          </div>
        </div>
      )}

      {view && d && loaded && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-12 lg:gap-6">
          <Hero view={view} studiedToday={d.studiedToday} fresh={loaded.fresh} />
          <StudyDays d={d} today={loaded.today} fresh={loaded.fresh} />
          <ExamTile view={view} d={d} />
          <XpTile d={d} />
          <QuizEntry />
          <GrammarEntry />
        </div>
      )}

      <p className="text-base text-ink-2">
        <a className="inline-flex min-h-11 items-center underline underline-offset-4" href="/nguon-du-lieu">
          Nguồn dữ liệu và giấy phép
        </a>
      </p>
    </main>
  );
}
