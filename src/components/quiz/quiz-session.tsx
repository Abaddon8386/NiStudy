"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { buildQuiz, QUIZ_LENGTH, scoreQuiz, type QuizQuestion } from "@/lib/domain/quiz";
import { loadQuizData, submitQuiz } from "@/lib/learning/quiz";
import { BigKanji } from "@/ui/BigKanji";
import { buttonClasses } from "@/ui/button-styles";
import { EmptyState } from "@/ui/EmptyState";
import { Notice } from "@/ui/Notice";
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
    const have = Math.min(phase.available, QUIZ_LENGTH);
    return (
      <main
        id="noi-dung"
        tabIndex={-1}
        className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-paper px-4 py-6 lg:max-w-[640px] lg:bg-ground lg:px-0 lg:py-10"
      >
        <h1 className="sr-only">Trắc nghiệm</h1>
        <div className="my-auto [&>div>div:last-child]:self-stretch">
          <EmptyState
            title="Chưa đủ thẻ để làm trắc nghiệm"
            body={
              <span data-testid="not-enough">
                Bạn cần học thêm thẻ để làm trắc nghiệm (cần ít nhất {QUIZ_LENGTH} câu, hiện có {phase.available}).
              </span>
            }
            action={
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-medium">
                    Đã học {have}/{QUIZ_LENGTH} thẻ cần thiết
                  </p>
                  <div
                    role="progressbar"
                    aria-label="Số thẻ đã học so với số thẻ cần thiết"
                    aria-valuemin={0}
                    aria-valuemax={QUIZ_LENGTH}
                    aria-valuenow={have}
                    className="mt-2 h-3 w-full overflow-hidden rounded-full bg-hair"
                  >
                    <div className="progress-fill h-full rounded-full bg-teal" style={{ width: `${(have / QUIZ_LENGTH) * 100}%` }} />
                  </div>
                </div>
                <Link href="/on-tap" className={buttonClasses("primary", "lg")}>
                  Ôn tập
                </Link>
              </div>
            }
          />
          <p className="mt-4 text-center">
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
  const hanViet = q.type === "kanji-hanviet";
  const optText = hanViet
    ? "text-[22px] leading-[1.25] font-extrabold lg:text-[24px]"
    : q.optionsAreJapanese
      ? "text-[20px] leading-[1.3] font-medium"
      : "text-[18px] leading-[1.3] font-medium";

  return (
    <main id="noi-dung" tabIndex={-1} className={shell}>
      <h1 className="sr-only">Trắc nghiệm</h1>
      <header className="flex items-center gap-3">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center rounded-full px-2 text-base font-medium">
          Thoát
        </Link>
        <div
          role="progressbar"
          aria-label="Tiến độ trắc nghiệm"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index}
          className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-hair"
        >
          <div className="progress-fill h-full rounded-full bg-teal" style={{ width: `${(index / total) * 100}%` }} />
        </div>
        <p aria-live="polite" className="min-w-14 text-right text-base font-bold tabular-nums">
          <span className="sr-only">Câu </span>
          {index + 1} / {total}
        </p>
      </header>
      {!online ? (
        <Notice tone="warn" className="mt-3">
          Đang mất mạng. Bạn vẫn làm tiếp được, kết quả sẽ gửi khi có mạng.
        </Notice>
      ) : null}

      <div className="my-4 flex flex-1 flex-col justify-center gap-5">
        <div
          key={index}
          ref={promptRef}
          tabIndex={-1}
          role="group"
          aria-label={`Câu ${index + 1} trên ${total}`}
          className="card-in flex flex-col items-center px-2 py-4 text-center focus:outline-none"
        >
          <p className="text-base font-bold text-ink-2">
            {q.type === "vocab-meaning" ? "Từ này nghĩa là gì?" : q.type === "vocab-word" ? "Nghĩa này là từ nào?" : "Âm Hán Việt của chữ này?"}
          </p>
          {q.promptIsJapanese ? (
            <BigKanji text={q.prompt} variant="quiz" kanji={hanViet} testId="quiz-prompt" className="mt-4" />
          ) : (
            <p data-testid="quiz-prompt" className="mt-4 text-[32px] leading-[1.25] font-extrabold">
              {q.prompt}
            </p>
          )}
          {q.promptReading ? (
            <p lang="ja" className="mt-3 text-[24px] leading-snug text-ink-2">
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
                className={`press flex ${hanViet ? "min-h-16" : "min-h-14"} w-full items-center gap-3 rounded-[20px] border-2 px-4 py-2 text-left ${
                  isRight
                    ? "border-ink bg-marker"
                    : isWrong
                      ? "border-bad bg-paper text-bad"
                      : answered
                        ? "border-ring bg-paper text-ink-2"
                        : "border-ink bg-paper hover:bg-sand"
                } ${answered ? "cursor-default" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className="hidden size-8 flex-none items-center justify-center rounded-lg bg-sand text-[14px] font-bold text-ink-2 [@media(hover:hover)_and_(pointer:fine)]:flex"
                >
                  {i + 1}
                </span>
                <span lang={q.optionsAreJapanese ? "ja" : undefined} data-testid="opt-text" className={`min-w-0 flex-1 break-words ${optText}`}>
                  {opt}
                </span>
                {isRight ? (
                  <>
                    <span aria-hidden="true" className="flex size-7 flex-none items-center justify-center rounded-full bg-good text-base font-bold text-white">
                      ✓
                    </span>
                    <span className="flex-none rounded-full bg-paper px-3 py-0.5 text-base font-bold">Đáp án đúng</span>
                  </>
                ) : null}
                {isWrong ? (
                  <>
                    <span aria-hidden="true" className="flex size-7 flex-none items-center justify-center rounded-full bg-bad text-base font-bold text-white">
                      ✕
                    </span>
                    <span className="flex-none rounded-full bg-paper px-3 py-0.5 text-base font-bold">Bạn chọn</span>
                  </>
                ) : null}
              </button>
            );
          })}
        </div>

        <p aria-live="assertive" data-testid="answer-feedback" className="min-h-7 text-[20px] font-bold">
          {answered ? (
            correct ? (
              <span className="text-good">
                <span aria-hidden="true">✓ </span>Đúng!
              </span>
            ) : (
              <span className="text-bad">
                <span aria-hidden="true">✕ </span>Sai. Đáp án đúng:{" "}
                <span lang={q.optionsAreJapanese ? "ja" : undefined}>{q.options[q.correctIndex]}</span>
              </span>
            )
          ) : null}
        </p>
      </div>

      <div className="min-h-14">
        {answered ? (
          <button ref={nextBtn} type="button" onClick={next} className={buttonClasses("primary", "lg", "w-full")}>
            {index + 1 >= total ? "Xem kết quả" : "Câu tiếp"}
            <kbd
              aria-hidden="true"
              className="hidden rounded-md bg-paper/20 px-1.5 font-sans text-[14px] font-medium [@media(hover:hover)_and_(pointer:fine)]:inline-flex"
            >
              Enter
            </kbd>
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
