"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { grade, newCardState, type FsrsRating } from "@/lib/domain/fsrs";
import { formatInterval } from "@/lib/domain/interval";
import type { SessionCard } from "@/lib/domain/queue";
import { buildReview, cardStateFromJson } from "@/lib/domain/review";
import { advance, currentCard, isFinished, startSession, summarize, type SessionState } from "@/lib/domain/session";
import { deviceTimeZone, loadTodaySession } from "@/lib/learning/api";
import { createClient } from "@/lib/supabase/client";
import { getOutbox, usePendingCount } from "@/lib/learning/outbox";
import { CardBack, CardFront } from "./card-faces";
import { ReviewSummary } from "./review-summary";

const RATING_BUTTONS: { rating: FsrsRating; label: string; cls: string }[] = [
  { rating: 1, label: "Lại", cls: "bg-paper text-ink" },
  { rating: 2, label: "Khó", cls: "bg-paper text-ink" },
  { rating: 3, label: "Được", cls: "bg-teal text-white" },
  { rating: 4, label: "Dễ", cls: "bg-marker text-ink" },
];

type Load = { kind: "loading" } | { kind: "error" } | { kind: "ready"; session: SessionState };

const shell = "mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-ground px-4 pt-3 pb-6";
const primaryBtn =
  "inline-flex min-h-14 items-center justify-center rounded-full bg-ink px-8 text-[18px] font-bold text-paper";

export function ReviewSession() {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [flipped, setFlipped] = useState(false);
  const [previews, setPreviews] = useState<Record<FsrsRating, string> | null>(null);
  const sessionId = useRef<string>("");
  const busy = useRef(false);
  const flipBtn = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const pending = usePendingCount();

  const start = useCallback(async () => {
    setLoad({ kind: "loading" });
    sessionId.current = crypto.randomUUID();
    const r = await loadTodaySession();
    setFlipped(false);
    setLoad(r.ok ? { kind: "ready", session: startSession(r.cards) } : { kind: "error" });
  }, []);

  useEffect(() => {
    // Tải dữ liệu khi vào trang.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void start();
  }, [start]);

  const session = load.kind === "ready" ? load.session : null;
  const card: SessionCard | null = session ? currentCard(session) : null;
  const cardKey = session ? session.index : -1;

  // Khoảng ôn kế tiếp cho 4 mức (ts-fsrs), tính khi thẻ mới hiện; không bắt buộc nên lỗi thì bỏ qua.
  useEffect(() => {
    if (!card) return;
    let cancelled = false;
    const now = new Date();
    const before = card.state ? cardStateFromJson(card.state) : newCardState(now);
    Promise.all(([1, 2, 3, 4] as const).map((r) => grade(before, r, now)))
      .then((res) => {
        if (cancelled) return;
        setPreviews({
          1: formatInterval(now, res[0].state.due),
          2: formatInterval(now, res[1].state.due),
          3: formatInterval(now, res[2].state.due),
          4: formatInterval(now, res[3].state.due),
        });
      })
      .catch(() => {
        if (!cancelled) setPreviews(null);
      });
    return () => {
      cancelled = true;
    };
    // Chỉ tính lại khi đổi thẻ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey]);

  useEffect(() => {
    if (flipped) backRef.current?.focus();
    else flipBtn.current?.focus();
  }, [flipped, cardKey]);

  const flip = useCallback(() => setFlipped(true), []);

  const onGrade = useCallback(
    async (rating: FsrsRating) => {
      if (busy.current || load.kind !== "ready") return;
      const c = currentCard(load.session);
      if (!c) return;
      busy.current = true;
      try {
        const { data: sess } = await createClient().auth.getSession();
        const userId = sess.session?.user.id;
        if (!userId) return;
        // Tính lịch ngay trên thiết bị, không chờ mạng (NFR-03).
        const { payload } = await buildReview({
          cardId: c.card.id,
          stateBefore: c.state ? cardStateFromJson(c.state) : null,
          rating,
          now: new Date(),
          sessionId: sessionId.current,
          timeZone: deviceTimeZone(),
        });
        getOutbox().enqueue(payload, userId);
        setPreviews(null);
        setFlipped(false);
        setLoad((l) =>
          l.kind === "ready" ? { kind: "ready", session: advance(l.session, rating, payload.state_after) } : l,
        );
      } finally {
        busy.current = false;
      }
    },
    [load],
  );

  // Phím tắt: Space lật, 1 đến 4 chấm (NFR-06).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !card) return;
      const t = e.target as HTMLElement | null;
      if (e.key === " ") {
        // Nút đang focus tự xử lý Space (click); chỉ xử lý khi focus ở nơi khác.
        if (t?.closest("button, a, input, select, textarea")) return;
        e.preventDefault();
        if (!flipped) flip();
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        void onGrade(Number(e.key) as FsrsRating);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, flipped, flip, onGrade]);

  // Cảnh báo khi đóng hoặc tải lại tab lúc còn lượt chưa gửi (hàng chờ chưa lưu bền: TODO FR-27).
  useEffect(() => {
    if (pending === 0) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [pending]);

  const summary = useMemo(() => (session ? summarize(session.results) : null), [session]);

  if (load.kind === "loading") {
    return (
      <main className={shell} aria-busy="true">
        <h1 className="sr-only">Phiên ôn</h1>
        <p role="status" className="my-auto text-center text-base text-ink-2">
          Đang tải thẻ…
        </p>
      </main>
    );
  }

  if (load.kind === "error") {
    return (
      <main className={shell}>
        <h1 className="sr-only">Phiên ôn</h1>
        <div className="my-auto text-center">
          <p role="alert" className="text-[20px] leading-snug">
            Chưa tải được thẻ hôm nay.
          </p>
          <button type="button" onClick={() => void start()} className={`mt-4 ${primaryBtn}`}>
            Thử lại
          </button>
          <p className="mt-4">
            <Link href="/" className="inline-flex min-h-11 items-center text-base underline underline-offset-4">
              Về trang chính
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const s = load.session;
  if (s.cards.length === 0) {
    return (
      <main className={shell}>
        <h1 className="sr-only">Phiên ôn</h1>
        <div className="my-auto text-center">
          <p className="text-[24px] leading-snug font-bold">Hôm nay không còn thẻ cần ôn.</p>
          <Link href="/" className={`mt-6 ${primaryBtn}`}>
            Về trang chính
          </Link>
        </div>
      </main>
    );
  }

  if (isFinished(s) || !card || !summary) {
    return <ReviewSummary summary={summary ?? summarize([])} pending={pending} />;
  }

  const total = s.cards.length;
  return (
    <main className={shell}>
      <h1 className="sr-only">Phiên ôn</h1>
      <header className="flex items-center justify-between">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center px-2 text-base font-medium">
          Thoát
        </Link>
        <p aria-live="polite" className="text-base font-bold">
          <span className="sr-only">Thẻ </span>
          {s.index + 1} / {total}
        </p>
        <span className="min-w-11" aria-hidden="true" />
      </header>
      <div
        role="progressbar"
        aria-label="Tiến độ phiên ôn"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={s.index}
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-hair"
      >
        <div className="progress-fill h-full rounded-full bg-teal" style={{ width: `${(s.index / total) * 100}%` }} />
      </div>

      <div className="my-4 flex flex-1 flex-col justify-center">
        <div className="relative">
          {card.isNew ? (
            <span className="absolute top-3 left-3 z-10 rounded-lg bg-marker px-2 py-0.5 text-sm font-bold">
              Thẻ mới
            </span>
          ) : null}
          <div key={cardKey} className="flip-card">
            <div className="flip-inner" data-flipped={flipped}>
              <div
                className="flip-face rounded-[32px] border-2 border-ink bg-paper p-6"
                data-active={!flipped}
                inert={flipped}
                aria-hidden={flipped}
              >
                <CardFront card={card} />
              </div>
              <div
                ref={backRef}
                tabIndex={-1}
                role="group"
                aria-label="Mặt sau của thẻ"
                className="flip-face flip-back rounded-[32px] border-2 border-ink bg-paper p-6 outline-offset-4"
                data-active={flipped}
                inert={!flipped}
                aria-hidden={!flipped}
              >
                <CardBack card={card} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-[72px]">
        {!flipped ? (
          <button
            ref={flipBtn}
            type="button"
            onClick={flip}
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-ink px-6 text-[18px] font-bold text-paper"
          >
            Lật thẻ
            <span className="text-sm font-normal text-ring">Space</span>
          </button>
        ) : (
          <div className="rating-in grid grid-cols-4 gap-2">
            {RATING_BUTTONS.map(({ rating, label, cls }) => (
              <button
                key={rating}
                type="button"
                onClick={() => void onGrade(rating)}
                aria-keyshortcuts={String(rating)}
                className={`relative flex min-h-[72px] flex-col items-center justify-center rounded-[20px] border-2 border-ink px-1 pt-4 pb-1 ${cls}`}
              >
                <span aria-hidden="true" className="absolute top-1 left-2 text-sm">
                  {rating}
                </span>
                <span className="text-[18px] leading-tight font-bold">{label}</span>
                <span className="min-h-5 text-sm leading-tight">
                  {previews ? (
                    <>
                      <span className="sr-only">, sau </span>
                      {previews[rating]}
                    </>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
