"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { buildQuiz, QUIZ_LENGTH, scoreQuiz, type QuizQuestion } from "@/lib/domain/quiz";
import { loadQuizData, submitQuiz } from "@/lib/learning/quiz";
import { QuizResult, type SaveState } from "./quiz-result";

type Phase =
  | { kind: "loading" }
  | { kind: "offline" }
  | { kind: "not-enough"; available: number }
  | { kind: "playing"; questions: QuizQuestion[] };

const shell =
  "mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-ground px-4 pt-3 pb-6 lg:max-w-[640px] lg:px-0 lg:pt-6";
const primaryBtn =
  "inline-flex min-h-14 items-center justify-center rounded-full bg-ink px-8 text-[18px] font-bold text-paper";
const linkBtn = "inline-flex min-h-11 items-center text-base underline underline-offset-4";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}
const useOnline = () =>
  useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );

export function QuizSession() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [save, setSave] = useState<SaveState>("saving");
  const quizId = useRef("");
  const sent = useRef(false);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const online = useOnline();

  const start = useCallback(async () => {
    setPhase({ kind: "loading" });
    setIndex(0);
    setAnswers([]);
    setFinished(false);
    setSave("saving");
    sent.current = false;
    quizId.current = crypto.randomUUID();
    if (!navigator.onLine) return setPhase({ kind: "offline" });
    const r = await loadQuizData();
    if (!r.ok) return setPhase({ kind: "offline" });
    const b = buildQuiz(r.data.learned, r.data.pool, Math.random);
    setPhase(b.ok ? { kind: "playing", questions: b.questions } : { kind: "not-enough", available: b.available });
  }, []);

  useEffect(() => {
    // Tải dữ liệu khi vào trang.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void start();
  }, [start]);

  // Có mạng lại (sự kiện online) thì tự mở bài (FR-26: thông báo tự ẩn).
  useEffect(() => {
    if (phase.kind !== "offline") return;
    const retry = () => void start();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [phase.kind, start]);

  const questions = phase.kind === "playing" ? phase.questions : null;
  const q = questions && !finished ? questions[index] : null;
  const chosen = answers[index] ?? null;
  const answered = chosen !== null;

  const choose = useCallback(
    (i: number) => {
      if (!q || answers[index] != null) return;
      setAnswers((a) => {
        const n = a.slice();
        n[index] = i;
        return n;
      });
    },
    [q, answers, index],
  );

  const next = useCallback(() => {
    if (!questions || answers[index] == null) return;
    if (index + 1 >= questions.length) setFinished(true);
    else setIndex(index + 1);
  }, [questions, answers, index]);

  // Phím tắt: 1 đến 4 chọn, Enter sang câu tiếp (NFR-06). Enter trên nút để nút tự xử lý.
  useEffect(() => {
    if (!q) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        choose(Number(e.key) - 1);
      } else if (e.key === "Enter" && answers[index] != null) {
        if ((e.target as HTMLElement | null)?.closest("button, a")) return;
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, choose, next, answers, index]);

  // Chọn xong thì focus nút "Câu tiếp"; câu mới thì focus vùng đề.
  useEffect(() => {
    if (answered) nextBtn.current?.focus();
  }, [answered]);
  useEffect(() => {
    if (q && !answered) promptRef.current?.focus({ preventScroll: true });
    // Chỉ khi đổi câu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, phase.kind]);

  const score = useMemo(() => (questions && finished ? scoreQuiz(questions, answers) : null), [questions, finished, answers]);

  const send = useCallback(async (correct: number) => {
    setSave("saving");
    try {
      await submitQuiz(quizId.current, correct); // 'accepted' và 'duplicate' đều là đã lưu
      setSave("saved");
    } catch {
      setSave("failed");
    }
  }, []);

  useEffect(() => {
    if (!score || sent.current) return;
    sent.current = true;
    // Gửi một lần khi hết bài.
    void send(score.correct);
  }, [score, send]);

  // Có mạng lại (sự kiện online) sau khi gửi lỗi thì tự gửi lại với cùng quiz_id.
  useEffect(() => {
    if (save !== "failed" || !score) return;
    const retry = () => void send(score.correct);
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [save, score, send]);

  if (phase.kind === "loading") {
    return (
      <main id="noi-dung" tabIndex={-1} className={shell} aria-busy="true">
        <h1 className="sr-only">Trắc nghiệm</h1>
        <p role="status" className="my-auto text-center text-base text-ink-2">
          Đang chuẩn bị câu hỏi…
        </p>
      </main>
    );
  }

  if (phase.kind === "offline") {
    return (
      <main id="noi-dung" tabIndex={-1} className={shell}>
        <h1 className="sr-only">Trắc nghiệm</h1>
        <div className="my-auto px-4 text-center">
          <p role="alert" className="text-[24px] leading-snug font-bold">
            Trắc nghiệm cần kết nối mạng.
          </p>
          <p className="mt-2 text-base text-ink-2">Có mạng lại, bài sẽ tự mở. Bạn cũng có thể thử lại ngay.</p>
          <button type="button" onClick={() => void start()} className={`mt-6 ${primaryBtn}`}>
            Thử lại
          </button>
          <p className="mt-4">
            <Link href="/" className={linkBtn}>
              Về trang chính
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if (phase.kind === "not-enough") {
    return (
      <main id="noi-dung" tabIndex={-1} className={shell}>
        <h1 className="sr-only">Trắc nghiệm</h1>
        <div className="my-auto px-4 text-center">
          <p className="text-[24px] leading-snug font-bold" data-testid="not-enough">
            Bạn cần học thêm thẻ để làm trắc nghiệm (cần ít nhất {QUIZ_LENGTH} câu, hiện có {phase.available}).
          </p>
          <Link href="/on-tap" className={`mt-6 ${primaryBtn}`}>
            Ôn tập
          </Link>
          <p className="mt-4">
            <Link href="/" className={linkBtn}>
              Về trang chính
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if (score) {
    return <QuizResult score={score} save={save} onRetry={() => void send(score.correct)} onAgain={() => void start()} />;
  }

  if (!q || !questions) return null;
  const total = questions.length;
  const correct = answered && chosen === q.correctIndex;
  const bigCls =
    q.type === "kanji-hanviet"
      ? "font-kanji text-[96px] leading-none font-semibold"
      : q.type === "vocab-meaning"
        ? "text-[56px] leading-tight font-medium"
        : "text-[32px] leading-tight font-extrabold";

  return (
    <main id="noi-dung" tabIndex={-1} className={shell}>
      <h1 className="sr-only">Trắc nghiệm</h1>
      <header className="flex items-center justify-between">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center px-2 text-base font-medium">
          Thoát
        </Link>
        <p aria-live="polite" className="text-base font-bold">
          <span className="sr-only">Câu </span>
          {index + 1} / {total}
        </p>
        <span className="min-w-11" aria-hidden="true" />
      </header>
      <div
        role="progressbar"
        aria-label="Tiến độ trắc nghiệm"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index}
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-hair"
      >
        <div className="progress-fill h-full rounded-full bg-teal" style={{ width: `${(index / total) * 100}%` }} />
      </div>
      {!online ? (
        <p role="status" className="mt-3 rounded-2xl bg-sand px-4 py-2 text-base">
          Đang mất mạng. Bạn vẫn làm tiếp được, kết quả sẽ gửi khi có mạng.
        </p>
      ) : null}

      <div className="my-4 flex flex-1 flex-col justify-center gap-4">
        <div
          key={index}
          ref={promptRef}
          tabIndex={-1}
          role="group"
          aria-label={`Câu ${index + 1} trên ${total}`}
          className="rounded-[32px] border-2 border-ink bg-paper px-6 py-8 text-center outline-offset-4"
        >
          <p className="text-[18px] font-bold text-ink-2">
            {q.type === "vocab-meaning" ? "Từ này nghĩa là gì?" : q.type === "vocab-word" ? "Nghĩa này là từ nào?" : "Âm Hán Việt của chữ này?"}
          </p>
          <p lang={q.promptIsJapanese ? "ja" : undefined} data-testid="quiz-prompt" className={`mt-3 ${bigCls}`}>
            {q.prompt}
          </p>
          {q.promptReading ? (
            <p lang="ja" className="mt-2 text-[24px] leading-snug text-ink-2">
              {q.promptReading}
            </p>
          ) : null}
        </div>

        <div role="group" aria-label="Các lựa chọn" className="grid gap-3">
          {q.options.map((opt, i) => {
            const isRight = answered && i === q.correctIndex;
            const isWrong = answered && i === chosen && i !== q.correctIndex;
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                aria-disabled={answered}
                aria-keyshortcuts={String(i + 1)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-[20px] border-2 px-4 py-2 text-left text-[18px] ${
                  isRight
                    ? "border-ink bg-marker font-bold"
                    : isWrong
                      ? "border-bad bg-paper font-bold text-bad"
                      : answered
                        ? "border-ring bg-paper text-ink-2"
                        : "border-ink bg-paper hover:bg-sand"
                } ${answered ? "cursor-default" : ""}`}
              >
                <span aria-hidden="true" className="flex size-8 flex-none items-center justify-center rounded-lg bg-sand text-sm font-bold text-ink-2">
                  {i + 1}
                </span>
                <span lang={q.optionsAreJapanese ? "ja" : undefined} data-testid="opt-text" className="min-w-0 flex-1 break-words">
                  {opt}
                </span>
                {isRight ? <span className="flex-none rounded-full bg-paper px-3 py-0.5 text-base font-bold">Đáp án đúng</span> : null}
                {isWrong ? <span className="flex-none rounded-full bg-paper px-3 py-0.5 text-base font-bold">Bạn chọn</span> : null}
              </button>
            );
          })}
        </div>

        <p aria-live="assertive" data-testid="answer-feedback" className="min-h-7 text-[20px] font-bold">
          {answered ? (
            correct ? (
              <span className="text-good">Đúng!</span>
            ) : (
              <span className="text-bad">
                Sai. Đáp án đúng:{" "}
                <span lang={q.optionsAreJapanese ? "ja" : undefined}>{q.options[q.correctIndex]}</span>
              </span>
            )
          ) : null}
        </p>
      </div>

      <div className="min-h-14">
        {answered ? (
          <button
            ref={nextBtn}
            type="button"
            onClick={next}
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-ink px-6 text-[18px] font-bold text-paper"
          >
            {index + 1 >= total ? "Xem kết quả" : "Câu tiếp"}
            <span className="hidden text-sm font-normal text-ring lg:inline">Enter</span>
          </button>
        ) : null}
      </div>
      <p className="mt-3 hidden text-center text-sm text-ink-2 lg:block" data-testid="shortcut-hint">
        Phím tắt: <kbd className="font-sans font-bold">1</kbd> đến <kbd className="font-sans font-bold">4</kbd> chọn đáp án ·{" "}
        <kbd className="font-sans font-bold">Enter</kbd> câu tiếp
      </p>
    </main>
  );
}
