"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { grade, newCardState, type FsrsRating } from "@/lib/domain/fsrs";
import { formatInterval } from "@/lib/domain/interval";
import type { SessionCard } from "@/lib/domain/queue";
import { buildReview, cardStateFromJson } from "@/lib/domain/review";
import { advance, currentCard, isFinished, startSession, summarize, type SessionState } from "@/lib/domain/session";
import { canResume } from "@/lib/domain/session-resume";
import { studyDate } from "@/lib/domain/study-day";
import { deviceTimeZone, loadTodaySession } from "@/lib/learning/api";
import { createClient } from "@/lib/supabase/client";
import { getOutbox, useOutboxFailing, usePendingCount, useUnpersistedCount } from "@/lib/learning/outbox";
import { deleteSnapshot, loadSnapshot, saveSnapshot } from "@/lib/offline/db";
import { useOnline } from "@/lib/offline/network-status";
import { speak, speechTextForCard, useAutoSpeak, useJapaneseVoice } from "@/lib/speech";
import { CardBack, CardFront } from "./card-faces";
import { ReviewSummary } from "./review-summary";
import { Notice } from "@/ui/Notice";
import { RatingButton } from "@/ui/RatingButton";

const RATING_LABELS: { rating: FsrsRating; label: string }[] = [
  { rating: 1, label: "Lại" },
  { rating: 2, label: "Khó" },
  { rating: 3, label: "Được" },
  { rating: 4, label: "Dễ" },
];

type Load = { kind: "loading" } | { kind: "error" } | { kind: "offline" } | { kind: "ready"; session: SessionState };

const shell = "mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-ground px-4 pt-3 pb-6 lg:max-w-[640px] lg:px-0 lg:pt-6";
const OFFLINE_MESSAGE =
  "Không có mạng. Không tải được thẻ mới; các lượt đã chấm sẽ được gửi khi có mạng.";
const primaryBtn =
  "inline-flex min-h-14 items-center justify-center rounded-full bg-ink px-8 text-[18px] font-bold text-paper";

export function ReviewSession() {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [flipped, setFlipped] = useState(false);
  const [previews, setPreviews] = useState<Record<FsrsRating, string> | null>(null);
  const sessionId = useRef<string>("");
  const studyDay = useRef<string>("");
  const busy = useRef(false);
  const flipBtn = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const pending = usePendingCount();
  const online = useOnline();
  const failing = useOutboxFailing();
  const unpersisted = useUnpersistedCount();

  const start = useCallback(async () => {
    setLoad({ kind: "loading" });
    setFlipped(false);
    const today = studyDate(new Date(), deviceTimeZone());
    let userId: string | undefined;
    try {
      userId = (await createClient().auth.getSession()).data.session?.user.id;
    } catch {
      /* không đọc được phiên: coi như phiên mới */
    }
    // Tiếp tục phiên đã lưu (cùng tài khoản, cùng ngày học, chưa xong), kể cả khi offline (FR-28).
    if (userId) {
      try {
        const snap = await loadSnapshot(userId);
        if (canResume(snap, userId, today)) {
          sessionId.current = snap.sessionId;
          studyDay.current = snap.studyDate;
          setLoad({ kind: "ready", session: snap.state });
          return;
        }
        if (snap) await deleteSnapshot(userId); // khác ngày hoặc đã xong: bỏ
      } catch (e) {
        console.warn("review: không đọc được phiên đã lưu", e);
      }
    }
    if (!navigator.onLine) {
      setLoad({ kind: "offline" });
      return;
    }
    sessionId.current = crypto.randomUUID();
    studyDay.current = today;
    const r = await loadTodaySession();
    if (!r.ok) {
      setLoad({ kind: navigator.onLine ? "error" : "offline" });
      return;
    }
    const session = startSession(r.cards);
    setLoad({ kind: "ready", session });
    if (userId && r.cards.length > 0) {
      saveSnapshot({ userId, sessionId: sessionId.current, studyDate: today, state: session }).catch((e) =>
        console.warn("review: không lưu được phiên", e),
      );
    }
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

  const { status: voiceStatus, voice } = useJapaneseVoice();
  const [autoSpeak] = useAutoSpeak();

  // Tự phát gọi ngay trong thao tác bấm/phím lật (iOS chỉ cho phát trong cử chỉ người dùng); không chờ gì.
  const flip = useCallback(() => {
    setFlipped(true);
    if (autoSpeak && voiceStatus === "ready" && card) {
      const text = speechTextForCard(card);
      if (text) speak(text, voice);
    }
  }, [autoSpeak, voiceStatus, voice, card]);

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
        // Ghi IndexedDB trong nền (không chặn thẻ kế); snapshot chỉ ghi sau khi lượt ôn đã có bản bền (FR-27, FR-28).
        const persisted = getOutbox().enqueue(payload, userId);
        const next = advance(load.session, rating, payload.state_after);
        const day = studyDay.current;
        const sid = sessionId.current;
        void persisted
          .then(() =>
            isFinished(next)
              ? deleteSnapshot(userId)
              : saveSnapshot({ userId, sessionId: sid, studyDate: day, state: next }),
          )
          .catch((e) => console.warn("review: không lưu được phiên", e));
        setPreviews(null);
        setFlipped(false);
        setLoad({ kind: "ready", session: next });
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

  // Chỉ cảnh báo khi đóng/tải lại tab nếu còn lượt chưa gửi VÀ chưa có bản bền (IndexedDB lỗi/không dùng được).
  useEffect(() => {
    if (unpersisted === 0) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [unpersisted]);

  // Có mạng lại khi đang ở màn "không có mạng" (chưa có phiên): tự thử tải lại (FR-26).
  const isOffline = load.kind === "offline";
  useEffect(() => {
    if (!isOffline) return;
    const retry = () => void start();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [isOffline, start]);

  const summary = useMemo(() => (session ? summarize(session.results) : null), [session]);

  if (load.kind === "loading") {
    return (
      <main id="noi-dung" tabIndex={-1} className={shell} aria-busy="true">
        <h1 className="sr-only">Phiên ôn</h1>
        <p role="status" className="my-auto text-center text-base text-ink-2">
          Đang tải thẻ…
        </p>
      </main>
    );
  }

  if (load.kind === "offline") {
    return (
      <main id="noi-dung" tabIndex={-1} className={shell}>
        <h1 className="sr-only">Phiên ôn</h1>
        <div className="my-auto text-center">
          <p role="status" className="text-[20px] leading-snug">
            {OFFLINE_MESSAGE}
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

  if (load.kind === "error") {
    return (
      <main id="noi-dung" tabIndex={-1} className={shell}>
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
      <main id="noi-dung" tabIndex={-1} className={shell}>
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
  const remaining = total - s.index - 1; // thẻ còn lại sau thẻ này: quyết định số lớp "chồng thẻ" phía sau
  const face = "flip-face flex flex-col rounded-[32px] border-2 border-ink bg-paper p-6 lg:p-10";
  const layer = "pointer-events-none absolute inset-x-0 top-0 bottom-5 origin-bottom rounded-[32px] border-2 border-ink bg-paper";
  return (
    <main id="noi-dung" tabIndex={-1} className={shell}>
      <h1 className="sr-only">Phiên ôn</h1>
      <div role="status" data-testid="network-banner">
        {!online || failing ? (
          <Notice tone="warn" role="status" className="mb-2">
            {online
              ? "Chưa kết nối được máy chủ. Bạn vẫn ôn tiếp được; các lượt đã chấm được lưu trên máy và sẽ tự gửi khi có mạng."
              : "Mất kết nối mạng. Bạn vẫn ôn tiếp được; các lượt đã chấm được lưu trên máy và sẽ tự gửi khi có mạng."}
          </Notice>
        ) : null}
      </div>
      <header className="flex items-center gap-3">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center rounded-full px-2 text-base font-medium">
          Thoát
        </Link>
        <div
          role="progressbar"
          aria-label="Tiến độ phiên ôn"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={s.index}
          className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-hair"
        >
          <div className="progress-fill h-full rounded-full bg-teal" style={{ width: `${(s.index / total) * 100}%` }} />
        </div>
        <p aria-live="polite" className="min-w-14 text-right text-base font-bold tabular-nums">
          <span className="sr-only">Thẻ </span>
          {s.index + 1} / {total}
        </p>
      </header>

      <div className="relative mt-4 flex min-h-[420px] flex-1 flex-col pb-5 lg:min-h-[520px]">
        {remaining >= 2 ? <div aria-hidden="true" className={`${layer} translate-y-5 scale-[0.92]`} /> : null}
        {remaining >= 1 ? <div aria-hidden="true" className={`${layer} translate-y-2.5 scale-[0.96]`} /> : null}
        {card.isNew ? (
          <span className="absolute top-4 left-4 z-20 rounded-lg bg-marker px-2 py-0.5 text-sm font-bold">Thẻ mới</span>
        ) : null}
        <div key={cardKey} className="flip-card card-in relative z-10 flex-1">
          <div className="flip-inner" data-flipped={flipped}>
            <div className={face} data-active={!flipped} inert={flipped} aria-hidden={flipped}>
              <CardFront card={card} flipRef={flipBtn} onFlip={flip} />
            </div>
            <div
              ref={backRef}
              tabIndex={-1}
              role="group"
              aria-label="Mặt sau của thẻ"
              className={`${face} flip-back focus:outline-none`}
              data-active={flipped}
              inert={!flipped}
              aria-hidden={!flipped}
            >
              <CardBack card={card} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-1 min-h-[76px]">
        {flipped ? (
          <div className="rating-in grid grid-cols-4 gap-2">
            {RATING_LABELS.map(({ rating, label }) => (
              <RatingButton
                key={rating}
                rating={rating}
                label={label}
                interval={previews ? previews[rating] : null}
                onClick={() => void onGrade(rating)}
              />
            ))}
          </div>
        ) : null}
      </div>
      <p className="mt-3 hidden text-center text-sm text-ink-2 lg:block" data-testid="shortcut-hint">
        Phím tắt: <kbd className="font-sans font-bold">Space</kbd> lật thẻ · <kbd className="font-sans font-bold">1</kbd>{" "}
        Lại · <kbd className="font-sans font-bold">2</kbd> Khó · <kbd className="font-sans font-bold">3</kbd> Được ·{" "}
        <kbd className="font-sans font-bold">4</kbd> Dễ
      </p>
    </main>
  );
}
