import type { QuizScore } from "@/lib/domain/quiz";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Notice } from "@/ui/Notice";
import { Seal } from "@/ui/Seal";
import { CountUp } from "@/ui/motion/CountUp";
import { Reveal } from "@/ui/motion/Reveal";

export type SaveState = "saving" | "saved" | "failed";

/** Kết quả trắc nghiệm (S-11): điểm lớn trong khối sand (dấu triện khi đúng hết), XP, câu sai kèm đáp án đúng. */
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
  const perfect = score.total > 0 && score.correct === score.total;
  return (
    <main
      id="noi-dung"
      tabIndex={-1}
      className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-paper px-4 py-8 lg:max-w-[640px] lg:bg-ground lg:px-0"
    >
      <h1 className="text-[40px] leading-[1.15] font-extrabold">Xong bài</h1>
      <Card tone="sand" className="relative mt-5 p-6 text-center">
        {perfect ? <Seal char="満" size={72} rotate={-8} stamp className="absolute -top-4 -right-2" /> : null}
        <p className="text-[72px] leading-none font-extrabold" data-testid="quiz-score">
          <CountUp value={score.correct} />/{score.total}
        </p>
        <p className="mt-2 text-[18px] text-ink-2">câu đúng</p>
        <p className="mt-3 inline-block rounded-full bg-marker px-4 py-1 text-[20px] font-bold" data-testid="quiz-xp">
          +{score.correct} XP
        </p>
      </Card>

      <div data-testid="save-status" className="mt-4 min-h-12">
        {save === "saving" ? <Notice tone="info">Đang lưu kết quả…</Notice> : null}
        {save === "saved" ? <Notice tone="success">Đã lưu.</Notice> : null}
        {save === "failed" ? (
          <Notice tone="error">
            <span className="flex flex-wrap items-center gap-3">
              <span className="font-bold">Chưa lưu được.</span>
              <Button variant="secondary" onClick={onRetry}>
                Thử lại
              </Button>
            </span>
          </Notice>
        ) : null}
      </div>

      {score.wrong.length > 0 ? (
        <section aria-labelledby="wrong-h" className="mt-5">
          <h2 id="wrong-h" className="text-[24px] font-bold">
            Câu cần xem lại
          </h2>
          <ul className="mt-3 flex list-none flex-col gap-3 p-0" data-testid="wrong-list">
            {score.wrong.map(({ question: q, chosen }, i) => (
              <Reveal as="li" index={i} key={q.cardId}>
                <Card tone="sand">
                  <p lang={q.promptIsJapanese ? "ja" : undefined} className="text-[24px] leading-snug font-bold">
                    {q.prompt}
                    {q.promptReading ? (
                      <span className="ml-3 text-base font-medium text-ink-2">{q.promptReading}</span>
                    ) : null}
                  </p>
                  <p className="mt-2 text-base">
                    <span aria-hidden="true" className="mr-1 font-bold text-good">
                      ✓
                    </span>
                    Đáp án đúng:{" "}
                    <strong lang={q.optionsAreJapanese ? "ja" : undefined}>{q.options[q.correctIndex]}</strong>
                  </p>
                  <p className="text-base text-ink-2">
                    <span aria-hidden="true" className="mr-1 font-bold text-bad">
                      ✕
                    </span>
                    Bạn chọn:{" "}
                    <span lang={q.optionsAreJapanese && chosen !== null ? "ja" : undefined}>
                      {chosen === null ? "chưa chọn" : q.options[chosen]}
                    </span>
                  </p>
                </Card>
              </Reveal>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-5 text-[20px] leading-snug">Bạn trả lời đúng cả {score.total} câu.</p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <Button href="/" size="lg">
          Về trang chính
        </Button>
        <Button variant="secondary" size="lg" onClick={onAgain}>
          Làm bài khác
        </Button>
      </div>
    </main>
  );
}
