"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadDashboard } from "@/lib/learning/dashboard";
import { usePendingCount } from "@/lib/learning/outbox";
import { buildDashboardView, type DashboardData, type DashboardView } from "@/lib/domain/dashboard-view";
import { CountUp } from "@/ui/motion/CountUp";
import { Reveal } from "@/ui/motion/Reveal";
import { SplitWords } from "@/ui/motion/SplitWords";
import { useInView } from "@/ui/motion/use-in-view";

interface Loaded {
  data: DashboardData;
  today: string;
}

const nf = new Intl.NumberFormat("vi-VN");
const card = "rounded-[24px] border border-hair bg-paper p-6 tabular-nums";
const label = "text-base font-bold text-ink-2";

function longDate(today: string) {
  const d = new Date(`${today}T00:00:00Z`);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(d);
}

function headline(v: DashboardView): string {
  if (v.done) return "Hôm nay đã xong";
  return `Hôm nay: ${v.total} thẻ, khoảng ${v.minutes} phút`;
}

const startClass =
  "flex min-h-14 w-full items-center justify-center rounded-full bg-marker px-6 text-[18px] font-bold text-ink focus-visible:outline-paper lg:inline-flex lg:w-auto lg:min-w-[280px]";

function StartLink() {
  return (
    <Link href="/on-tap" className={startClass}>
      Bắt đầu ôn
    </Link>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải số liệu" className="flex flex-col gap-4 lg:grid lg:grid-cols-12">
      <div className="h-[300px] rounded-[24px] bg-hair lg:col-span-9" />
      <div className="h-[200px] rounded-[24px] bg-hair lg:col-span-3 lg:h-[300px]" />
      <div className="h-[120px] rounded-[24px] bg-hair lg:col-span-12" />
    </div>
  );
}

/** Thanh tiến độ chạy từ 0 tới giá trị khi vào khung nhìn (450ms, ease-out). */
function NewBar({ pct, done, goal }: { pct: number; done: number; goal: number }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-labelledby="new-progress-label"
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={Math.min(done, goal)}
      className="mt-2 h-3 overflow-hidden rounded-full bg-track"
    >
      <div className="bar-fill h-full rounded-full bg-marker" style={{ width: `${inView ? pct : 0}%` }} />
    </div>
  );
}

function ExamBlock({ exam }: { exam: NonNullable<DashboardView["exam"]> }) {
  return (
    <section aria-labelledby="blk-exam" className={`${card} h-full`}>
      <h2 id="blk-exam" className={label}>
        Ngày thi
      </h2>
      {exam.kind === "days" && (
        <p className="mt-2 text-[32px] leading-tight font-extrabold">Còn {nf.format(exam.days)} ngày</p>
      )}
      {exam.kind === "today" && <p className="mt-2 text-[32px] leading-tight font-extrabold">Hôm nay thi</p>}
      {exam.kind === "past" && (
        <p className="mt-2 text-base">
          Ngày thi đã qua.{" "}
          <Link href="/cai-dat" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
            Đặt ngày mới hoặc xóa trong Cài đặt
          </Link>
        </p>
      )}
    </section>
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
        setLoaded({ data: r.data, today: r.today });
        setFailed(false);
      } else if (!hasData.current) {
        setFailed(true);
      }
    });
  }, [pending, reloadKey]);

  const view = loaded ? buildDashboardView(loaded.data, loaded.today) : null;
  const d = loaded?.data;

  return (
    <main id="noi-dung" tabIndex={-1} className="flex flex-col gap-6 px-4 py-6 lg:p-8">
      <header>
        <SplitWords
          as="h1"
          key={view ? headline(view) : "Hôm nay"}
          text={view ? headline(view) : "Hôm nay"}
          className="text-[28px] leading-[1.2] font-extrabold lg:text-[40px]"
        />
        {loaded && <p className="mt-1 text-base text-ink-2 first-letter:uppercase">{longDate(loaded.today)}</p>}
        {pending > 0 && (
          <p role="status" className="mt-1 text-sm text-ink-2 tabular-nums">
            Đang đồng bộ {pending} lượt ôn
          </p>
        )}
      </header>

      {!loaded && !failed && <Skeleton />}

      {!loaded && failed && (
        <section className="rounded-[24px] bg-teal p-6 text-white">
          <p role="alert" className="text-base">
            Chưa tải được số liệu.
          </p>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <button
              type="button"
              onClick={retry}
              className="min-h-11 rounded-full border-2 border-white px-6 text-base font-bold focus-visible:outline-paper"
            >
              Thử lại
            </button>
            <StartLink />
          </div>
        </section>
      )}

      {view && d && (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12">
          <Reveal
            as="section"
            index={0}
            aria-labelledby="blk-today"
            className="rounded-[24px] bg-teal p-6 text-white tabular-nums lg:col-span-9 lg:p-10"
          >
            <h2 id="blk-today" className="text-base font-bold">
              Ôn hôm nay
            </h2>
            {view.done ? (
              <>
                <p className="mt-3 text-[20px] leading-snug font-bold">Không còn thẻ nào cần ôn.</p>
                <p className="mt-2 text-base">Hẹn gặp lại vào ngày mai.</p>
                <Link
                  href="/kana"
                  className="mt-6 inline-flex min-h-11 items-center text-base font-bold underline underline-offset-4 focus-visible:outline-paper"
                >
                  Xem bảng kana
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-[56px] leading-none font-extrabold lg:text-[72px]">
                  <CountUp value={view.total} />
                  <span className="ml-3 text-[20px] font-bold">thẻ cần ôn</span>
                </p>
                <p className="mt-3 text-base">
                  {nf.format(view.dueToday)} thẻ đến hạn · {nf.format(view.newRemaining)} thẻ mới · khoảng{" "}
                  {view.minutes} phút
                </p>
                <div className="mt-6">
                  <div className="flex items-baseline justify-between text-base">
                    <span id="new-progress-label">Thẻ mới hôm nay</span>
                    <span>
                      {view.newProgress.done} / {view.newProgress.goal}
                    </span>
                  </div>
                  <NewBar pct={view.newProgress.pct} done={view.newProgress.done} goal={view.newProgress.goal} />
                </div>
                <div className="mt-8">
                  <StartLink />
                </div>
              </>
            )}
          </Reveal>

          <Reveal as="section" index={1} aria-labelledby="blk-days" className={`${card} lg:col-span-3`}>
            <h2 id="blk-days" className={label}>
              Ngày học
            </h2>
            <p className="mt-2 text-[48px] leading-none font-extrabold lg:text-[56px]"><CountUp value={d.totalDays} />
            </p>
            <p className="mt-1 text-base text-ink-2">ngày đã học</p>
            <p className="mt-4 text-base">
              {d.streak > 0 ? `Chuỗi ${nf.format(d.streak)} ngày` : "Bắt đầu chuỗi mới hôm nay"}
            </p>
          </Reveal>

          {view.exam && (
            <Reveal index={2} className="lg:col-span-6">
              <ExamBlock exam={view.exam} />
            </Reveal>
          )}

          <Reveal
            as="section"
            index={3}
            aria-labelledby="blk-xp"
            className={`${card} ${view.exam ? "lg:col-span-6" : "lg:col-span-12"}`}
          >
            <h2 id="blk-xp" className={label}>
              XP
            </h2>
            <p className="mt-2 text-[32px] leading-tight font-extrabold">
              <CountUp value={d.xpTotal} />
            </p>
            <p className="text-base text-ink-2">hôm nay +{nf.format(d.xpToday)}</p>
          </Reveal>
        </div>
      )}

      <p className="px-2 text-base text-ink-2">
        <a className="inline-flex min-h-11 items-center underline underline-offset-4" href="/nguon-du-lieu">
          Nguồn dữ liệu và giấy phép
        </a>
      </p>
    </main>
  );
}
