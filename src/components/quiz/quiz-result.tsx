import Link from "next/link";
import type { QuizScore } from "@/lib/domain/quiz";
import { CountUp } from "@/ui/motion/CountUp";
import { Reveal } from "@/ui/motion/Reveal";

export type SaveState = "saving" | "saved" | "failed";

const btn = "inline-flex min-h-14 items-center justify-center rounded-full px-6 text-[18px] font-bold";

/** Kết quả trắc nghiệm (S-11): số câu đúng, XP, câu sai kèm đáp án đúng. */
export function QuizResult({
  score,
  save,
  onRetry,
  onAgain,
}: {
  score: QuizScore;
  save: SaveState;
  onRetry: () => void;
  onAgain: () => void;
}) {
  return (
    <main id="noi-dung" tabIndex={-1} className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-paper px-5 py-8 lg:max-w-[640px] lg:my-8 lg:min-h-0 lg:rounded-[28px] lg:border lg:border-hair lg:px-10 lg:py-12">
      <h1 className="text-[48px] leading-[1.1] font-extrabold">Xong bài</h1>
      <div className="mt-6 rounded-[28px] bg-sand p-6 text-center">
        <p className="text-[64px] leading-none font-extrabold" data-testid="quiz-score">
          <CountUp value={score.correct} />/{score.total}
        </p>
        <p className="mt-1 text-[18px] text-ink-2">câu đúng</p>
        <p className="mt-3 inline-block rounded-full bg-marker px-4 py-1 text-[20px] font-bold" data-testid="quiz-xp">
          +{score.correct} XP
        </p>
      </div>

      <div aria-live="polite" className="mt-4 min-h-7 text-base" data-testid="save-status">
        {save === "saving" ? <p className="text-ink-2">Đang lưu kết quả…</p> : null}
        {save === "saved" ? <p className="text-ink-2">Đã lưu.</p> : null}
        {save === "failed" ? (
          <p className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-bad">Chưa lưu được.</span>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-11 items-center rounded-full border-2 border-ink px-5 font-bold"
            >
              Thử lại
            </button>
          </p>
        ) : null}
      </div>

      {score.wrong.length > 0 ? (
        <section aria-labelledby="wrong-h" className="mt-4">
          <h2 id="wrong-h" className="text-[24px] font-bold">
            Câu cần xem lại
          </h2>
          <ul className="mt-3 flex list-none flex-col gap-3 p-0" data-testid="wrong-list">
            {score.wrong.map(({ question: q, chosen }, i) => (
              <Reveal as="li" index={i} key={q.cardId} className="rounded-[20px] border border-hair bg-paper p-4">
                <p lang={q.promptIsJapanese ? "ja" : undefined} className="text-[24px] leading-snug font-bold">
                  {q.prompt}
                  {q.promptReading ? (
                    <span className="ml-3 text-base font-medium text-ink-2">{q.promptReading}</span>
                  ) : null}
                </p>
                <p className="mt-1 text-base">
                  Đáp án đúng:{" "}
                  <strong lang={q.optionsAreJapanese ? "ja" : undefined}>{q.options[q.correctIndex]}</strong>
                </p>
                <p className="text-base text-ink-2">
                  Bạn chọn:{" "}
                  <span lang={q.optionsAreJapanese && chosen !== null ? "ja" : undefined}>
                    {chosen === null ? "chưa chọn" : q.options[chosen]}
                  </span>
                </p>
              </Reveal>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-4 text-[20px] leading-snug">Bạn trả lời đúng cả {score.total} câu.</p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <Link href="/" className={`${btn} bg-ink text-paper`}>
          Về trang chính
        </Link>
        <button type="button" onClick={onAgain} className={`${btn} border-2 border-ink bg-paper text-ink`}>
          Làm bài khác
        </button>
      </div>
    </main>
  );
}
