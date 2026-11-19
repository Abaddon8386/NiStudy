import Link from "next/link";
import type { SessionSummary } from "@/lib/domain/session";

const RATINGS = [
  [1, "Lại"],
  [2, "Khó"],
  [3, "Được"],
  [4, "Dễ"],
] as const;

export function ReviewSummary({ summary, pending }: { summary: SessionSummary; pending: number }) {
  return (
    <main id="noi-dung" tabIndex={-1} className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-paper px-5 py-8 lg:max-w-[640px] lg:my-8 lg:min-h-0 lg:rounded-[28px] lg:border lg:border-hair lg:px-10 lg:py-12">
      <div
        aria-hidden="true"
        className="stamp-in mb-6 flex size-[160px] items-center justify-center self-center rounded-full border-[3px] border-seal-edge bg-seal font-kanji text-[72px] font-semibold text-white"
        lang="ja"
      >
        学
      </div>
      <h1 className="text-[48px] leading-[1.1] font-extrabold">Xong phiên ôn</h1>
      <p className="mt-3 text-[20px] leading-snug">
        Bạn đã ôn {summary.total} lượt, trong đó {summary.newCards} thẻ mới.
      </p>
      <dl className="mt-6 grid grid-cols-4 gap-2">
        {RATINGS.map(([r, label]) => (
          <div key={r} className="rounded-[22px] bg-sand p-3 text-center">
            <dt className="text-sm text-ink-2">{label}</dt>
            <dd className="text-[32px] leading-tight font-extrabold">{summary.byRating[r]}</dd>
          </div>
        ))}
      </dl>
      <p aria-live="polite" className="mt-6 min-h-6 text-base text-ink-2" data-testid="send-status">
        {pending === 0 ? "Đã lưu hết." : `Còn ${pending} lượt chưa gửi, sẽ thử lại.`}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-14 items-center justify-center rounded-full bg-ink px-6 text-[18px] font-bold text-paper"
      >
        Về trang chính
      </Link>
    </main>
  );
}
